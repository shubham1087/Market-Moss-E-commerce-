package com.ecommerce.ecommerce_backend.service.impl;

import com.ecommerce.ecommerce_backend.dto.ChatMessage;
import com.ecommerce.ecommerce_backend.dto.ChatRequest;
import com.ecommerce.ecommerce_backend.dto.ChatResponse;
import com.ecommerce.ecommerce_backend.dto.ProductResponse;
import com.ecommerce.ecommerce_backend.entity.Product;
import com.ecommerce.ecommerce_backend.exception.GeminiServiceException;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import com.ecommerce.ecommerce_backend.service.GeminiChatService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GeminiChatServiceImpl implements GeminiChatService {

    private static final int MAX_RECOMMENDATIONS = 6;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ProductRepository productRepository;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;
    private final Duration timeout;

    public GeminiChatServiceImpl(ProductRepository productRepository,
                                @Value("${gemini.api.key:${spring.ai.google.genai.api-key:}}") String apiKey,
                                @Value("${gemini.model:${spring.ai.google.genai.model:gemini-2.5-flash}}") String model,
                                @Value("${gemini.timeout-ms:20000}") long timeoutMs) {
        this.productRepository = productRepository;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "gemini-2.5-flash" : model.trim();
        this.timeout = Duration.ofMillis(timeoutMs > 0 ? timeoutMs : 20000L);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public ChatResponse generateReply(ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }
        if (apiKey.isBlank()) {
            throw new GeminiServiceException("GEMINI_API_KEY is missing. Set the environment variable before using /api/chat.");
        }

        List<Product> allProducts = productRepository.findAll();
        List<Product> relevantProducts = selectRelevantProducts(request.getMessage(), allProducts);

        String prompt = buildPrompt(request.getMessage(), request.getConversationHistory(), relevantProducts);
        String replyText = generateGeminiReply(prompt);

        List<ProductResponse> recommendedProducts = relevantProducts.stream()
                .map(this::mapToProductResponse)
                .toList();

        return ChatResponse.builder()
                .reply(replyText)
                .recommendedProducts(recommendedProducts)
                .build();
    }

    private String buildPrompt(String userMessage, List<ChatMessage> history, List<Product> relevantProducts) {
        String catalog = relevantProducts.isEmpty()
                ? "[]"
                : relevantProducts.stream()
                        .map(this::productToCatalogEntry)
                        .collect(Collectors.joining(",", "[", "]"));

        StringBuilder builder = new StringBuilder();
        builder.append("You are Market & Moss's shopping assistant. Use only the catalog data provided below. ");
        builder.append("Prefer products that match the user's request, price range, and intent. ");
        builder.append("If no exact match exists, suggest the closest alternatives and clearly say so. ");
        builder.append("Answer in a natural, friendly tone. Include 2-5 product suggestions when possible. ");
        builder.append("Do not invent products, prices, or stock that are not in the catalog. \n\n");

        if (history != null && !history.isEmpty()) {
            builder.append("Conversation history:\n");
            for (ChatMessage message : history) {
                if (message == null) {
                    continue;
                }
                String sanitizedContent = sanitizePromptText(message.getContent());
                if (!sanitizedContent.isBlank()) {
                    builder.append(message.getRole()).append(": ").append(sanitizedContent).append("\n");
                }
            }
            builder.append("\n");
        }

        builder.append("Current user message: ").append(sanitizePromptText(userMessage)).append("\n\n");
        builder.append("Catalog:\n").append(catalog).append("\n");

        return builder.toString();
    }

    private String sanitizePromptText(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[\\r\\n\\t]+", " ").trim();
    }

    private List<Product> selectRelevantProducts(String userMessage, List<Product> allProducts) {
        String normalized = userMessage.toLowerCase(Locale.ROOT);
        if (allProducts.isEmpty()) {
            return List.of();
        }

        List<Product> scored = new ArrayList<>();
        for (Product product : allProducts) {
            if (product == null || product.getCategory() == null) {
                continue;
            }
            int score = scoreProductMatch(normalized, product);
            if (score > 0) {
                scored.add(product);
            }
        }

        if (scored.isEmpty()) {
            return allProducts.stream()
                    .filter(product -> product != null && product.getQuantity() != null && product.getQuantity() > 0)
                    .limit(MAX_RECOMMENDATIONS)
                    .toList();
        }

        return scored.stream()
                .sorted(Comparator.comparingInt((Product product) -> scoreProductMatch(normalized, product)).reversed())
                .limit(MAX_RECOMMENDATIONS)
                .toList();
    }

    private int scoreProductMatch(String message, Product product) {
        String name = product.getName() == null ? "" : product.getName().toLowerCase(Locale.ROOT);
        String description = product.getDescription() == null ? "" : product.getDescription().toLowerCase(Locale.ROOT);
        String categoryName = product.getCategory() == null || product.getCategory().getName() == null
                ? ""
                : product.getCategory().getName().toLowerCase(Locale.ROOT);

        int score = 0;
        Set<String> tokens = java.util.Arrays.stream(message.split("[^a-zA-Z0-9]+"))
                .filter(token -> !token.isBlank())
                .collect(Collectors.toSet());

        for (String token : tokens) {
            if (name.contains(token)) {
                score += 4;
            }
            if (description.contains(token)) {
                score += 2;
            }
            if (categoryName.contains(token)) {
                score += 2;
            }
        }

        if (message.contains("under") || message.contains("below") || message.contains("budget")) {
            score += 1;
        }
        if (product.getQuantity() != null && product.getQuantity() > 0) {
            score += 1;
        }
        return score;
    }

    private String productToCatalogEntry(Product product) {
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Unknown";
        return "{\"id\":" + product.getId() +
                ",\"name\":" + sanitizeJson(product.getName()) +
                ",\"description\":" + sanitizeJson(product.getDescription()) +
                ",\"price\":" + (product.getPrice() != null ? product.getPrice().toPlainString() : "0") +
                ",\"quantity\":" + (product.getQuantity() == null ? 0 : product.getQuantity()) +
                ",\"imageUrl\":" + sanitizeJson(product.getImageUrl()) +
                ",\"category\":" + sanitizeJson(categoryName) + "}";
    }

    private String sanitizeJson(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\\", "\\\\").replace("\"", "\\\"");
        return escaped.replace("\n", " ").replace("\r", " ");
    }

    private String generateGeminiReply(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        Map<String, Object> requestBody = new LinkedHashMap<>();
        Map<String, Object> systemInstruction = new LinkedHashMap<>();
        systemInstruction.put("parts", List.of(Map.of("text", "You are a helpful market assistant for an e-commerce store. Return concise recommendations and avoid invented facts.")));
        requestBody.put("systemInstruction", systemInstruction);

        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> userMessage = new LinkedHashMap<>();
        userMessage.put("role", "user");
        userMessage.put("parts", List.of(Map.of("text", prompt)));
        contents.add(userMessage);
        requestBody.put("contents", contents);

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", 500);
        requestBody.put("generationConfig", generationConfig);

        String jsonPayload;
        try {
            jsonPayload = OBJECT_MAPPER.writeValueAsString(requestBody);
        } catch (JsonProcessingException e) {
            throw new GeminiServiceException("Failed to prepare Gemini request payload.", e);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(timeout)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                String errorMessage = parseGeminiError(response.body());
                if (response.statusCode() == 429) {
                    throw new GeminiServiceException("Gemini API rate limit reached. Please try again in a few moments.");
                }
                if (response.statusCode() >= 500) {
                    throw new GeminiServiceException("Gemini API is temporarily unavailable. Please try again later.");
                }
                throw new GeminiServiceException(errorMessage != null ? errorMessage : "Gemini API request failed.");
            }

            JsonNode root = OBJECT_MAPPER.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isMissingNode() || candidates.isEmpty()) {
                throw new GeminiServiceException("Gemini returned an empty response.");
            }

            JsonNode firstCandidate = candidates.get(0);
            JsonNode content = firstCandidate.path("content");
            JsonNode parts = content.path("parts");
            if (parts.isMissingNode() || parts.isEmpty()) {
                throw new GeminiServiceException("Gemini returned a malformed response.");
            }

            StringBuilder responseText = new StringBuilder();
            for (JsonNode part : parts) {
                String text = part.path("text").asText(null);
                if (text != null && !text.isBlank()) {
                    responseText.append(text).append("\n");
                }
            }

            String finalText = responseText.toString().trim();
            if (finalText.isBlank()) {
                throw new GeminiServiceException("Gemini returned an empty response body.");
            }
            return finalText;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GeminiServiceException("Gemini request was interrupted.", e);
        } catch (java.io.IOException e) {
            throw new GeminiServiceException("Unable to reach the Gemini API. Please verify the service is available.", e);
        }
    }

    private String parseGeminiError(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            JsonNode root = OBJECT_MAPPER.readTree(body);
            JsonNode error = root.path("error");
            if (error.isMissingNode()) {
                return null;
            }
            JsonNode message = error.path("message");
            return message.isTextual() ? message.asText() : null;
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private ProductResponse mapToProductResponse(Product product) {
        if (product == null) {
            return null;
        }
        ProductResponse.CategorySummary summary = ProductResponse.CategorySummary.builder()
                .id(product.getCategory() != null ? product.getCategory().getId() : null)
                .name(product.getCategory() != null ? product.getCategory().getName() : null)
                .build();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .imageUrl(product.getImageUrl())
                .category(summary)
                .build();
    }
}

package com.ecommerce.ecommerce_backend.service.impl;

import com.ecommerce.ecommerce_backend.dto.ProductRequest;
import com.ecommerce.ecommerce_backend.dto.ProductResponse;
import com.ecommerce.ecommerce_backend.entity.Category;
import com.ecommerce.ecommerce_backend.entity.Product;
import com.ecommerce.ecommerce_backend.exception.BadRequestException;
import com.ecommerce.ecommerce_backend.exception.ResourceNotFoundException;
import com.ecommerce.ecommerce_backend.repository.CategoryRepository;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import com.ecommerce.ecommerce_backend.service.ProductService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    @org.springframework.beans.factory.annotation.Value("${image.storage.path:uploads}")
    private String imageStoragePath;

    @org.springframework.beans.factory.annotation.Value("${image.max-size:5242880}")
    private long maxImageSize /* bytes */;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Product product = Product.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .imageUrl(request.getImageUrl())
                .category(category)
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    @Override
    public List<ProductResponse> createProducts(List<ProductRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Product list cannot be empty");
        }

        List<Product> productsToSave = new ArrayList<>();
        for (ProductRequest request : requests) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

            Product product = Product.builder()
                    .name(request.getName().trim())
                    .description(request.getDescription())
                    .price(request.getPrice())
                    .quantity(request.getQuantity())
                    .imageUrl(request.getImageUrl())
                    .category(category)
                    .build();

            productsToSave.add(product);
        }

        return productRepository.saveAll(productsToSave).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);

        return mapToResponse(productRepository.save(product));
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        productRepository.delete(product);
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ProductResponse mapToResponse(Product product) {
        ProductResponse.CategorySummary categorySummary = ProductResponse.CategorySummary.builder()
                .id(product.getCategory().getId())
                .name(product.getCategory().getName())
                .build();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .imageUrl(product.getImageUrl())
                .category(categorySummary)
                .build();
    }

    @Override
    public ProductResponse uploadProductImage(Long id, org.springframework.web.multipart.MultipartFile file) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new BadRequestException("Invalid image type. Only image files are allowed");
        }

        if (file.getSize() > maxImageSize) {
            throw new BadRequestException("Image file is too large. Max allowed size: " + maxImageSize + " bytes");
        }

        try {
            java.nio.file.Path storageDir = java.nio.file.Paths.get(imageStoragePath).toAbsolutePath().normalize();
            java.nio.file.Files.createDirectories(storageDir);

            String original = file.getOriginalFilename();
            String extension = "";
            if (original != null && original.contains(".")) {
                extension = original.substring(original.lastIndexOf('.'));
            }

            String filename = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path target = storageDir.resolve(filename);

            try (java.io.InputStream is = file.getInputStream()) {
                java.nio.file.Files.copy(is, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            // Expose under /images/{filename}
            product.setImageUrl("/images/" + filename);
            Product saved = productRepository.save(product);
            return mapToResponse(saved);
        } catch (java.io.IOException ex) {
            throw new BadRequestException("Failed to store image file: " + ex.getMessage());
        }
    }
}

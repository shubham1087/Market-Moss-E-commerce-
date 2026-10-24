package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.ChatRequest;
import com.ecommerce.ecommerce_backend.dto.ChatResponse;

public interface GeminiChatService {
    ChatResponse generateReply(ChatRequest request);
}

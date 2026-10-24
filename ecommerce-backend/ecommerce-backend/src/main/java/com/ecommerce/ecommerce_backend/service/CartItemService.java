package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.CartItemRequest;
import com.ecommerce.ecommerce_backend.dto.CartItemResponse;

public interface CartItemService {
    CartItemResponse addItemToCart(Long userId, CartItemRequest request);
    CartItemResponse updateCartItem(Long userId, Long itemId, CartItemRequest request);
    void removeCartItem(Long userId, Long itemId);
}

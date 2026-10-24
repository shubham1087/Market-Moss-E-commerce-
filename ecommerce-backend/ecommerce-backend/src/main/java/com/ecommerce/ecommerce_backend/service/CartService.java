package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.AddToCartRequestDTO;
import com.ecommerce.ecommerce_backend.dto.CartResponse;
import com.ecommerce.ecommerce_backend.dto.CartResponseDTO;
import com.ecommerce.ecommerce_backend.dto.UpdateCartItemRequestDTO;

public interface CartService {
    CartResponse getCartByUserId(Long userId);
    CartResponseDTO addItemToCart(Long userId, AddToCartRequestDTO request);
    CartResponseDTO getCartDetails(Long userId);
    CartResponseDTO updateCartItem(Long userId, Long productId, UpdateCartItemRequestDTO request);
    void removeCartItem(Long userId, Long productId);
    void clearCart(Long userId);
}

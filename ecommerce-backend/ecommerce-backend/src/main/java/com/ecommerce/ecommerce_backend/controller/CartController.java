package com.ecommerce.ecommerce_backend.controller;

import com.ecommerce.ecommerce_backend.dto.AddToCartRequestDTO;
import com.ecommerce.ecommerce_backend.dto.CartItemRequest;
import com.ecommerce.ecommerce_backend.dto.CartItemResponse;
import com.ecommerce.ecommerce_backend.dto.CartResponse;
import com.ecommerce.ecommerce_backend.dto.CartResponseDTO;
import com.ecommerce.ecommerce_backend.dto.UpdateCartItemRequestDTO;
import com.ecommerce.ecommerce_backend.service.CartItemService;
import com.ecommerce.ecommerce_backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CartController {

    private final CartService cartService;
    private final CartItemService cartItemService;

    public CartController(CartService cartService, CartItemService cartItemService) {
        this.cartService = cartService;
        this.cartItemService = cartItemService;
    }

    @GetMapping("/cart/{userId}")
    public ResponseEntity<CartResponse> getCartByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @PostMapping("/cart/{userId}/add")
    public ResponseEntity<CartResponseDTO> addItemToCart(@PathVariable Long userId,
                                                       @Valid @RequestBody AddToCartRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartService.addItemToCart(userId, request));
    }

    @PutMapping("/cart/{userId}/item/{productId}")
    public ResponseEntity<CartResponseDTO> updateCartItem(@PathVariable Long userId,
                                                        @PathVariable Long productId,
                                                        @Valid @RequestBody UpdateCartItemRequestDTO request) {
        return ResponseEntity.ok(cartService.updateCartItem(userId, productId, request));
    }

    @DeleteMapping("/cart/{userId}/item/{productId}")
    public ResponseEntity<Void> removeCartItem(@PathVariable Long userId, @PathVariable Long productId) {
        cartService.removeCartItem(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/cart/{userId}/clear")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/cart/{userId}/items")
    public ResponseEntity<CartItemResponse> addItemToCartLegacy(@PathVariable Long userId,
                                                             @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartItemService.addItemToCart(userId, request));
    }

    @PutMapping("/cart/{userId}/items/{itemId}")
    public ResponseEntity<CartItemResponse> updateCartItemLegacy(@PathVariable Long userId,
                                                              @PathVariable Long itemId,
                                                              @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartItemService.updateCartItem(userId, itemId, request));
    }

    @DeleteMapping("/cart/{userId}/items/{itemId}")
    public ResponseEntity<Void> removeCartItemLegacy(@PathVariable Long userId, @PathVariable Long itemId) {
        cartItemService.removeCartItem(userId, itemId);
        return ResponseEntity.noContent().build();
    }
}

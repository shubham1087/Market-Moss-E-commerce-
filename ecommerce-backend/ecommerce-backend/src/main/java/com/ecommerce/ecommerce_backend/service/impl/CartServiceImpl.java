package com.ecommerce.ecommerce_backend.service.impl;

import com.ecommerce.ecommerce_backend.dto.AddToCartRequestDTO;
import com.ecommerce.ecommerce_backend.dto.CartItemResponse;
import com.ecommerce.ecommerce_backend.dto.CartItemResponseDTO;
import com.ecommerce.ecommerce_backend.dto.CartResponse;
import com.ecommerce.ecommerce_backend.dto.CartResponseDTO;
import com.ecommerce.ecommerce_backend.dto.UpdateCartItemRequestDTO;
import com.ecommerce.ecommerce_backend.entity.Cart;
import com.ecommerce.ecommerce_backend.entity.CartItem;
import com.ecommerce.ecommerce_backend.entity.Product;
import com.ecommerce.ecommerce_backend.entity.User;
import com.ecommerce.ecommerce_backend.exception.BadRequestException;
import com.ecommerce.ecommerce_backend.exception.ResourceNotFoundException;
import com.ecommerce.ecommerce_backend.repository.CartItemRepository;
import com.ecommerce.ecommerce_backend.repository.CartRepository;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import com.ecommerce.ecommerce_backend.repository.UserRepository;
import com.ecommerce.ecommerce_backend.service.CartService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartServiceImpl(CartRepository cartRepository,
                          CartItemRepository cartItemRepository,
                          UserRepository userRepository,
                          ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Override
    public CartResponse getCartByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<CartItemResponse> itemResponses = items.stream()
                .map(this::mapLegacyItemToResponse)
                .toList();

        return CartResponse.builder()
                .id(cart.getId())
                .userId(user.getId())
                .items(itemResponses)
                .build();
    }

    @Override
    public CartResponseDTO addItemToCart(Long userId, AddToCartRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        if (request.getQuantity() > product.getQuantity()) {
            throw new BadRequestException("Requested quantity exceeds available stock for product: " + product.getName());
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        CartItem existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);

        if (existingItem != null) {
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (newQuantity > product.getQuantity()) {
                throw new BadRequestException("Requested quantity exceeds available stock for product: " + product.getName());
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(newItem);
        }

        return getCartDetails(userId);
    }

    @Override
    public CartResponseDTO getCartDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        List<CartItemResponseDTO> itemResponses = items.stream()
                .map(this::mapItemToResponse)
                .toList();

        BigDecimal totalPrice = itemResponses.stream()
                .map(CartItemResponseDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponseDTO.builder()
                .cartId(cart.getId())
                .userId(userId)
                .items(itemResponses)
                .totalPrice(totalPrice)
                .build();
    }

    @Override
    public CartResponseDTO updateCartItem(Long userId, Long productId, UpdateCartItemRequestDTO request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found for product id: " + productId));

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        Product product = cartItem.getProduct();
        if (request.getQuantity() > product.getQuantity()) {
            throw new BadRequestException("Requested quantity exceeds available stock for product: " + product.getName());
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        return getCartDetails(userId);
    }

    @Override
    public void removeCartItem(Long userId, Long productId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found for product id: " + productId));

        cartItemRepository.delete(cartItem);
    }

    @Override
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        if (!items.isEmpty()) {
            cartItemRepository.deleteAll(items);
        }
    }

    private CartItemResponseDTO mapItemToResponse(CartItem cartItem) {
        BigDecimal price = cartItem.getProduct().getPrice();
        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemResponseDTO.builder()
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .price(price)
                .quantity(cartItem.getQuantity())
                .subtotal(subtotal)
                .build();
    }

    private CartItemResponse mapLegacyItemToResponse(CartItem cartItem) {
        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .quantity(cartItem.getQuantity())
                .build();
    }
}

package com.ecommerce.ecommerce_backend.service.impl;

import com.ecommerce.ecommerce_backend.dto.CartItemRequest;
import com.ecommerce.ecommerce_backend.dto.CartItemResponse;
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
import com.ecommerce.ecommerce_backend.service.CartItemService;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class CartItemServiceImpl implements CartItemService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartItemServiceImpl(CartRepository cartRepository,
                              CartItemRepository cartItemRepository,
                              ProductRepository productRepository,
                              UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CartItemResponse addItemToCart(Long userId, CartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        if (request.getQuantity() > product.getQuantity()) {
            throw new BadRequestException("Insufficient product stock for product id: " + product.getId());
        }

        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);

        if (cartItem != null) {
            int newQuantity = cartItem.getQuantity() + request.getQuantity();
            if (newQuantity > product.getQuantity()) {
                throw new BadRequestException("Insufficient product stock for product id: " + product.getId());
            }
            cartItem.setQuantity(newQuantity);
            CartItem savedItem = cartItemRepository.save(cartItem);
            return mapToResponse(savedItem);
        }

        CartItem newCartItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(request.getQuantity())
                .build();

        CartItem savedItem = cartItemRepository.save(newCartItem);
        return mapToResponse(savedItem);
    }

    @Override
    public CartItemResponse updateCartItem(Long userId, Long itemId, CartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!Objects.equals(cartItem.getCart().getId(), cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this cart");
        }

        Product product = cartItem.getProduct();
        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        if (request.getQuantity() > product.getQuantity()) {
            throw new BadRequestException("Insufficient product stock for product id: " + product.getId());
        }

        cartItem.setQuantity(request.getQuantity());
        return mapToResponse(cartItemRepository.save(cartItem));
    }

    @Override
    public void removeCartItem(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!Objects.equals(item.getCart().getId(), cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this cart");
        }

        cartItemRepository.delete(item);
    }

    private CartItemResponse mapToResponse(CartItem cartItem) {
        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .quantity(cartItem.getQuantity())
                .build();
    }
}

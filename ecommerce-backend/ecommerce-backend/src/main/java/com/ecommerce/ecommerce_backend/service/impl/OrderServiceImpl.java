package com.ecommerce.ecommerce_backend.service.impl;

import com.ecommerce.ecommerce_backend.dto.OrderItemRequestDTO;
import com.ecommerce.ecommerce_backend.dto.OrderItemResponseDTO;
import com.ecommerce.ecommerce_backend.dto.OrderRequestDTO;
import com.ecommerce.ecommerce_backend.dto.OrderResponseDTO;
import com.ecommerce.ecommerce_backend.entity.Cart;
import com.ecommerce.ecommerce_backend.entity.CartItem;
import com.ecommerce.ecommerce_backend.entity.Order;
import com.ecommerce.ecommerce_backend.entity.OrderItem;
import com.ecommerce.ecommerce_backend.entity.OrderStatus;
import com.ecommerce.ecommerce_backend.entity.Product;
import com.ecommerce.ecommerce_backend.entity.User;
import com.ecommerce.ecommerce_backend.exception.BadRequestException;
import com.ecommerce.ecommerce_backend.exception.ResourceNotFoundException;
import com.ecommerce.ecommerce_backend.repository.CartItemRepository;
import com.ecommerce.ecommerce_backend.repository.CartRepository;
import com.ecommerce.ecommerce_backend.repository.OrderItemRepository;
import com.ecommerce.ecommerce_backend.repository.OrderRepository;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import com.ecommerce.ecommerce_backend.repository.UserRepository;
import com.ecommerce.ecommerce_backend.service.OrderService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderServiceImpl implements OrderService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public OrderServiceImpl(UserRepository userRepository,
                           ProductRepository productRepository,
                           CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           OrderRepository orderRepository,
                           OrderItemRepository orderItemRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Override
    @Transactional
    public OrderResponseDTO createOrder(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user id: " + userId));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty. Add products before checkout.");
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(BigDecimal.ZERO)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            BigDecimal price = product.getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product '" + product.getName() + "'. Available: " + product.getQuantity() + ", requested: " + cartItem.getQuantity());
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(price)
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(subtotal);
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }

        savedOrder.setOrderItems(orderItems);
        savedOrder.setTotalAmount(totalAmount);
        Order finalOrder = orderRepository.save(savedOrder);
        orderItemRepository.saveAll(orderItems);
        cartItemRepository.deleteAll(cartItems);

        return mapToResponse(finalOrder, orderItems);
    }

    @Override
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO request) {
        if (request == null) {
            throw new BadRequestException("Order request is required");
        }
        if (request.getUserId() == null) {
            throw new BadRequestException("User id is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("At least one product is required for the order");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Map<Long, Integer> requestedQuantitiesByProduct = new HashMap<>();
        for (OrderItemRequestDTO itemRequest : request.getItems()) {
            if (itemRequest == null) {
                throw new BadRequestException("Order item is required");
            }
            if (itemRequest.getProductId() == null) {
                throw new BadRequestException("Product id is required for each order item");
            }
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new BadRequestException("Quantity must be greater than zero for product id: " + itemRequest.getProductId());
            }
            requestedQuantitiesByProduct.merge(itemRequest.getProductId(), itemRequest.getQuantity(), Integer::sum);
        }

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : requestedQuantitiesByProduct.entrySet()) {
            Long productId = entry.getKey();
            Integer quantity = entry.getValue();

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

            if (quantity > product.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product '" + product.getName() + "'. Available: " + product.getQuantity() + ", requested: " + quantity);
            }

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(quantity)
                    .price(product.getPrice())
                    .subtotal(subtotal)
                    .build();
            orderItems.add(orderItem);
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);
        for (OrderItem item : orderItems) {
            item.setOrder(savedOrder);
            Product product = item.getProduct();
            product.setQuantity(product.getQuantity() - item.getQuantity());
            productRepository.save(product);
        }
        savedOrder.setOrderItems(orderItems);
        Order finalOrder = orderRepository.save(savedOrder);
        orderItemRepository.saveAll(orderItems);

        return mapToResponse(finalOrder, orderItems);
    }

    @Override
    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(order -> mapToResponse(order, orderItemRepository.findByOrderId(order.getId())))
                .toList();
    }

    @Override
    public OrderResponseDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        return mapToResponse(order, items);
    }

    @Override
    public List<OrderResponseDTO> getOrdersByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Order> orders = orderRepository.findByUserId(userId);
        List<OrderResponseDTO> responses = new ArrayList<>();

        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            responses.add(mapToResponse(order, items));
        }

        return responses;
    }

    @Override
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (status == null) {
            throw new BadRequestException("Status is required");
        }

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        return mapToResponse(updatedOrder, items);
    }

    private OrderResponseDTO mapToResponse(Order order, List<OrderItem> items) {
        List<OrderItemResponseDTO> itemResponses = new ArrayList<>();

        for (OrderItem item : items) {
            itemResponses.add(OrderItemResponseDTO.builder()
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .price(item.getPrice())
                    .quantity(item.getQuantity())
                    .subtotal(item.getSubtotal())
                    .build());
        }

        return OrderResponseDTO.builder()
                .orderId(order.getId())
                .userId(order.getUser().getId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}

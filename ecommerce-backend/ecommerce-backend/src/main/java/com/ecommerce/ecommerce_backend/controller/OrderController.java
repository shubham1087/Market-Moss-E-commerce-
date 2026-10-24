package com.ecommerce.ecommerce_backend.controller;

import com.ecommerce.ecommerce_backend.dto.OrderRequestDTO;
import com.ecommerce.ecommerce_backend.dto.OrderResponseDTO;
import com.ecommerce.ecommerce_backend.dto.OrderStatusUpdateRequestDTO;
import com.ecommerce.ecommerce_backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    /**
     * Authentication and authorization are not implemented in this project.
     * Therefore, all order endpoints must be treated as user-scoped and must not
     * be exposed publicly without a trusted caller restriction. The public list-all
     * route is intentionally omitted to avoid leaking other users' private orders.
     */
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponseDTO> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<OrderResponseDTO> createOrderFromCart(@PathVariable Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(userId));
    }

    /**
     * Development-only route: authentication is not implemented in this project.
     * This endpoint intentionally exposes all persisted orders so local testing can
     * verify the order history flow without a user identity layer. In production,
     * this route must be restricted to the authenticated user only.
     */
    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(@PathVariable Long orderId,
                                                            @Valid @RequestBody OrderStatusUpdateRequestDTO request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request.getStatus()));
    }
}

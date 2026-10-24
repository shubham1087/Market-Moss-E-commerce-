package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.OrderRequestDTO;
import com.ecommerce.ecommerce_backend.dto.OrderResponseDTO;
import com.ecommerce.ecommerce_backend.entity.OrderStatus;

import java.util.List;

public interface OrderService {
    OrderResponseDTO createOrder(Long userId);
    OrderResponseDTO createOrder(OrderRequestDTO request);
    List<OrderResponseDTO> getAllOrders();
    OrderResponseDTO getOrderById(Long orderId);
    List<OrderResponseDTO> getOrdersByUserId(Long userId);
    OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status);
}

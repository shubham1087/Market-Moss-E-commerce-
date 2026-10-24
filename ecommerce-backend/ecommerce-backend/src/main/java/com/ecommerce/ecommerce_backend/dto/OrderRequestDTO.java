package com.ecommerce.ecommerce_backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Request body for creating a basic order.
 *
 * Example JSON:
 * {
 *   "userId": 1,
 *   "items": [
 *     { "productId": 10, "quantity": 2 },
 *     { "productId": 12, "quantity": 1 }
 *   ]
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDTO {

    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Order items are required")
    @NotEmpty(message = "At least one product must be included in the order")
    private List<OrderItemRequestDTO> items;
}

package com.ecommerce.ecommerce_backend.dto;

import com.ecommerce.ecommerce_backend.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateRequestDTO {

    @NotNull(message = "Status is required")
    private OrderStatus status;
}

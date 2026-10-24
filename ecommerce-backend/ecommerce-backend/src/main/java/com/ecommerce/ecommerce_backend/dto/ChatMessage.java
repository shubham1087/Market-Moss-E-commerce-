package com.ecommerce.ecommerce_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @NotBlank(message = "Message role is required")
    @Pattern(regexp = "^(user|assistant)$", message = "Role must be either 'user' or 'assistant'")
    private String role;

    @NotBlank(message = "Message content is required")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String content;
}

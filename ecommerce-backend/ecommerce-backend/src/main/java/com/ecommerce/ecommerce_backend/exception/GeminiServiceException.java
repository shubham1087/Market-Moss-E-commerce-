package com.ecommerce.ecommerce_backend.exception;

public class GeminiServiceException extends RuntimeException {
    public GeminiServiceException(String message) {
        super(message);
    }

    public GeminiServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}

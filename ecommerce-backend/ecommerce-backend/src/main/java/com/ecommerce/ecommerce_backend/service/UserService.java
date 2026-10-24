package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.AuthResponse;
import com.ecommerce.ecommerce_backend.dto.UserRequest;
import com.ecommerce.ecommerce_backend.dto.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse registerUser(UserRequest request);
    AuthResponse loginUser(String email, String password);
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
}

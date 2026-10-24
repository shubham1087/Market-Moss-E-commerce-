package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.ProductRequest;
import com.ecommerce.ecommerce_backend.dto.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    List<ProductResponse> createProducts(List<ProductRequest> requests);
    List<ProductResponse> getAllProducts();
    ProductResponse getProductById(Long id);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
    List<ProductResponse> getProductsByCategory(Long categoryId);

    // Upload or update product image (admin only)
    ProductResponse uploadProductImage(Long id, org.springframework.web.multipart.MultipartFile file);
}

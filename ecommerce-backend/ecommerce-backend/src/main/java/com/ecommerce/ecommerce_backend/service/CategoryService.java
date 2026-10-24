package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.dto.CategoryRequest;
import com.ecommerce.ecommerce_backend.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(CategoryRequest request);
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryById(Long id);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}

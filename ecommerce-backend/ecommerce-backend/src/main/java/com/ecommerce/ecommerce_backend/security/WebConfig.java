package com.ecommerce.ecommerce_backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${image.storage.path:uploads}")
    private String imageStoragePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolute = Paths.get(imageStoragePath).toAbsolutePath().toUri().toString();
        // map /images/** to the filesystem folder configured
        registry.addResourceHandler("/images/**")
                .addResourceLocations(absolute);
    }
}

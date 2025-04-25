package com.loopupchat.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Value("${socket.cors-origins:http://localhost:3000,http://localhost:8000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow the specified origins
        for (String origin : allowedOrigins.split(",")) {
            config.addAllowedOrigin(origin.trim());
        }

        // Allow credentials
        config.setAllowCredentials(true);

        // Allow all headers
        config.addAllowedHeader("*");

        // Allow all methods
        config.addAllowedMethod("*");

        // Apply this CORS configuration to all paths
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
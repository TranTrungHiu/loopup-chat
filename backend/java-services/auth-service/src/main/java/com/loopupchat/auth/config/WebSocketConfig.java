package com.loopupchat.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import com.loopupchat.auth.config.VideoCallHandler;
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final VideoCallHandler videoCallHandler;

    public WebSocketConfig(VideoCallHandler videoCallHandler) {
        this.videoCallHandler = videoCallHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(videoCallHandler, "/ws/video").setAllowedOrigins("*");
    }
}
package com.loopupchat.auth.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PreDestroy;

@Configuration
public class SocketIOConfig {

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:9092}")
    private Integer port;

    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration cfg = new com.corundumstudio.socketio.Configuration();
        cfg.setHostname(host);
        cfg.setPort(port);

        SocketConfig socketConfig = new SocketConfig();
        socketConfig.setReuseAddress(true);
        cfg.setSocketConfig(socketConfig);

        server = new SocketIOServer(cfg);
        return server;
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer server) {
        return new SpringAnnotationScanner(server);
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
        }
    }
}
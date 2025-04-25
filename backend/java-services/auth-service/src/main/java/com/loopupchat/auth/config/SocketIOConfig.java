package com.loopupchat.auth.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PreDestroy;
import java.util.Arrays;

@Configuration
public class SocketIOConfig {
    private static final Logger logger = LoggerFactory.getLogger(SocketIOConfig.class);

    @Value("${socket.host:0.0.0.0}")
    private String host;

    @Value("${socket.port:9090}")
    private Integer port;

    @Value("${socket.origins:*}")
    private String origins;

    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration cfg = new com.corundumstudio.socketio.Configuration();
        cfg.setHostname(host);
        cfg.setPort(port);

        // Xử lý CORS - cho phép tất cả các nguồn gốc trong quá trình phát triển
        cfg.setOrigin("*");

        // Cấu hình nâng cao cho socket để tối ưu kết nối
        SocketConfig socketConfig = new SocketConfig();
        socketConfig.setReuseAddress(true);
        socketConfig.setTcpNoDelay(true);
        socketConfig.setSoLinger(0);
        cfg.setSocketConfig(socketConfig);

        // Giảm thời gian ping để phát hiện vấn đề kết nối nhanh hơn
        cfg.setPingInterval(15000);
        cfg.setPingTimeout(10000);

        // Tăng buffer size cho các connection
        cfg.setMaxHttpContentLength(65536);

        // Bật debug để dễ theo dõi vấn đề
        cfg.setRandomSession(false);

        // Ghi log cấu hình
        logger.info("Configuring Socket.IO server on {}:{} with origins: {}", host, port, origins);
        logger.info("Socket.IO configuration: pingInterval={}, pingTimeout={}",
                cfg.getPingInterval(), cfg.getPingTimeout());

        server = new SocketIOServer(cfg);

        // Thêm listener xử lý lỗi server toàn cục
        server.addListeners(new SocketIOExceptionListener());

        return server;
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer server) {
        return new SpringAnnotationScanner(server);
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            logger.info("Stopping Socket.IO server");
            server.stop();
        }
    }
}
package com.loopupchat.auth.config;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.listener.ExceptionListener;
import io.netty.channel.ChannelHandlerContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class SocketIOExceptionListener implements ExceptionListener {
    private static final Logger logger = LoggerFactory.getLogger(SocketIOExceptionListener.class);

    @Override
    public void onEventException(Exception e, List<Object> args, SocketIOClient client) {
        logger.error("Socket.IO event exception: {}", e.getMessage(), e);
        // Gửi thông báo lỗi đến client để hiển thị
        client.sendEvent("error", "Lỗi xử lý sự kiện: " + e.getMessage());
    }

    @Override
    public void onDisconnectException(Exception e, SocketIOClient client) {
        logger.error("Socket.IO disconnect exception: {}", e.getMessage(), e);
    }

    @Override
    public void onConnectException(Exception e, SocketIOClient client) {
        logger.error("Socket.IO connect exception for client {}: {}",
                (client != null ? client.getSessionId() : "unknown"), e.getMessage(), e);
        if (client != null) {
            client.disconnect();
        }
    }

    @Override
    public void onPingException(Exception e, SocketIOClient client) {
        logger.error("Socket.IO ping exception: {}", e.getMessage(), e);
    }

    @Override
    public boolean exceptionCaught(ChannelHandlerContext ctx, Throwable e) {
        logger.error("Socket.IO general exception: {}", e.getMessage(), e);
        return false; // false = sử dụng xử lý mặc định, true = đã xử lý rồi
    }

    @Override
    public void onPongException(Exception e, SocketIOClient client) {
        logger.error("Socket.IO pong exception: {}", e.getMessage(), e);
    }
}
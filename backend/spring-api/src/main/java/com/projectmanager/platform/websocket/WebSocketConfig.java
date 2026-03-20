package com.projectmanager.platform.websocket;

import com.projectmanager.platform.config.SecurityProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatSocketHandler chatSocketHandler;
    private final SecurityProperties securityProperties;

    public WebSocketConfig(ChatSocketHandler chatSocketHandler, SecurityProperties securityProperties) {
        this.chatSocketHandler = chatSocketHandler;
        this.securityProperties = securityProperties;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatSocketHandler, "/ws/chat")
            .setAllowedOrigins(securityProperties.getAllowedOrigins().toArray(String[]::new));
    }
}

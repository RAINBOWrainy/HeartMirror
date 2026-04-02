package com.heartmirror.config;

import com.heartmirror.security.JwtAuthenticationFilter;
import com.heartmirror.security.LocalModeFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security Configuration
 *
 * JWT认证配置，定义公开和受保护的端点
 * 支持本地模式，跳过所有认证
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final LocalModeFilter localModeFilter;

    @Value("${app.local-mode:false}")
    private boolean localMode;

    // 公开端点（无需认证）
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/**",
            "/api/health",
            "/health",
            "/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/error",
            "/disclaimer",
            "/", "/index.html", "/assets/**",
            // 危机支持公开端点
            "/api/crisis/hotline",
            "/api/crisis/grounding-exercises"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // 本地模式：允许所有请求，注入默认用户
        if (localMode) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(localModeFilter, UsernamePasswordAuthenticationFilter.class);
        } else {
            // 正常模式：需要认证
            http.authorizeHttpRequests(auth -> auth
                            .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                            .anyRequest().authenticated())
                    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
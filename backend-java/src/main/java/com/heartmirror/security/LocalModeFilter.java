package com.heartmirror.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * 本地模式过滤器
 * 在本地部署模式下自动注入默认用户
 */
@Component
@RequiredArgsConstructor
public class LocalModeFilter extends OncePerRequestFilter {

    @Value("${app.local-mode:false}")
    private boolean localMode;

    // 使用与 LocalModeConfig 中创建的默认用户相同的用户名
    private static final String DEFAULT_USERNAME = "local_user";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (localMode && SecurityContextHolder.getContext().getAuthentication() == null) {
            // 创建默认用户 - 用户名必须与 LocalModeConfig 中创建的一致
            User defaultUser = new User(
                    DEFAULT_USERNAME,
                    "",
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            defaultUser,
                            null,
                            defaultUser.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !localMode;
    }
}
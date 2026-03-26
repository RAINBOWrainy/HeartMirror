package com.heartmirror.service;

import com.heartmirror.dto.AuthDTO;
import com.heartmirror.entity.User;
import com.heartmirror.repository.UserRepository;
import com.heartmirror.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 认证服务
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 用户注册
     */
    @Transactional
    public AuthDTO.LoginResponse register(AuthDTO.RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        // 创建新用户
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname() != null ? request.getNickname() : request.getUsername())
                .email(request.getEmail())
                .role(User.Role.USER)
                .isGuest(false)
                .build();

        user = userRepository.save(user);

        // 生成JWT令牌
        String token = jwtTokenProvider.generateToken(user.getUsername());

        return buildLoginResponse(user, token);
    }

    /**
     * 用户登录
     */
    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        User user = userService.findByUsername(request.getUsername());

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        // 生成JWT令牌
        String token = jwtTokenProvider.generateToken(user.getUsername());

        return buildLoginResponse(user, token);
    }

    /**
     * 游客登录
     */
    @Transactional
    public AuthDTO.LoginResponse guestLogin() {
        // 生成随机游客用户名
        String guestUsername = "guest_" + UUID.randomUUID().toString().substring(0, 8);

        User user = User.builder()
                .username(guestUsername)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .nickname("游客用户")
                .role(User.Role.GUEST)
                .isGuest(true)
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getUsername());

        return buildLoginResponse(user, token);
    }

    /**
     * 获取当前用户信息
     */
    public AuthDTO.UserDTO getCurrentUser(String username) {
        User user = userService.findByUsername(username);
        return toUserDTO(user);
    }

    private AuthDTO.LoginResponse buildLoginResponse(User user, String token) {
        return AuthDTO.LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L) // 24小时
                .user(toUserDTO(user))
                .build();
    }

    private AuthDTO.UserDTO toUserDTO(User user) {
        return AuthDTO.UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .isGuest(user.getIsGuest())
                .build();
    }
}
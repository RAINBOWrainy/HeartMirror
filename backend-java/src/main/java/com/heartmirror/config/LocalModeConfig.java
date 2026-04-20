package com.heartmirror.config;

import com.heartmirror.entity.User;
import com.heartmirror.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 本地模式配置
 * 在本地部署模式下自动创建默认用户
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class LocalModeConfig {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.local-mode:false}")
    private boolean localMode;

    @Value("${app.default-user.id:1}")
    private Long defaultUserId;

    @Value("${app.default-user.anonymous-id:本地用户}")
    private String defaultAnonymousId;

    @Value("${app.default-user.nickname:心镜用户}")
    private String defaultNickname;

    @Value("${app.default-user.username:local_user}")
    private String defaultUsername;

    @Value("${app.default-user.password:local_password}")
    private String defaultPassword;

    /**
     * 在本地模式下创建默认用户
     */
    @Bean
    public CommandLineRunner createDefaultUser() {
        return args -> {
            if (!localMode) {
                log.info("本地模式未启用，跳过默认用户创建");
                return;
            }

            // 检查用户是否已存在
            if (userRepository.existsById(defaultUserId)) {
                log.info("默认用户已存在，ID: {}", defaultUserId);
                return;
            }

            // 创建默认用户
            User defaultUser = User.builder()
                    .id(defaultUserId)
                    .username(defaultUsername)
                    .password(passwordEncoder.encode(defaultPassword))
                    .nickname(defaultNickname)
                    .role(User.Role.USER)
                    .isGuest(false)
                    .build();

            userRepository.save(defaultUser);
            log.info("本地模式：已创建默认用户，ID: {}, 昵称: {}", defaultUserId, defaultNickname);
        };
    }
}
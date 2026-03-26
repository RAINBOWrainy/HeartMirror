package com.heartmirror;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * HeartMirror Application Entry Point
 *
 * AI心理健康自助管理系统 - 企业级Java后端
 *
 * 核心功能:
 * - 实时情绪识别与追踪
 * - RAG驱动的对话式动态评估
 * - 风险量化与分层管理
 * - 循证个性化干预方案
 * - 干预效果跟踪与自适应调整
 * - 危机支持与转诊服务
 *
 * @author HeartMirror Team
 * @version 1.0.0
 */
@SpringBootApplication
public class HeartMirrorApplication {

    public static void main(String[] args) {
        SpringApplication.run(HeartMirrorApplication.class, args);
        System.out.println("""

                ========================================
                  HeartMirror 心理健康自助管理系统
                  AI Mental Health Self-Help System
                ========================================

                  API Docs: http://localhost:8080/swagger-ui.html
                  Health:   http://localhost:8080/health

                ========================================
                """);
    }
}
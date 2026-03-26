package com.heartmirror.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger Configuration
 *
 * API文档配置
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI heartMirrorOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HeartMirror API")
                        .description("""
                                ## HeartMirror - AI心理健康自助管理系统

                                闭环循证AI心理健康自助管理系统，面向18-28岁学生与年轻职场人群。

                                ### 核心功能
                                - 🔍 实时情绪识别与追踪
                                - 📋 RAG驱动的对话式动态评估
                                - 📊 风险量化与分层管理
                                - 💡 循证个性化干预方案
                                - 📈 干预效果跟踪与自适应调整
                                - 🆘 危机支持与转诊服务

                                ### 免责声明
                                ⚠️ 本产品为心理健康自助管理工具，不替代专业临床诊断和治疗。
                                如有严重心理问题，请及时寻求专业医疗帮助。

                                ### AI配置
                                用户可在前端"设置"页面配置自己的AI API Key、Base URL和模型。
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("HeartMirror Team")
                                .email("support@heartmirror.app"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                // JWT认证配置
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT认证，格式: Bearer {token}")));
    }
}
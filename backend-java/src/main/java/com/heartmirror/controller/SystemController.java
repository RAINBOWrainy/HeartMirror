package com.heartmirror.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 系统控制器
 */
@Tag(name = "系统", description = "系统健康检查和配置接口")
@RestController
public class SystemController {

    @Value("${crisis.hotline:400-161-9995}")
    private String crisisHotline;

    @Operation(summary = "健康检查")
    @GetMapping("/health")
    public Map<String, Object> healthCheck() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "healthy");
        result.put("app_name", "HeartMirror");
        result.put("version", "1.0.0");
        return result;
    }

    @Operation(summary = "免责声明")
    @GetMapping("/disclaimer")
    public Map<String, Object> getDisclaimer() {
        Map<String, Object> result = new HashMap<>();
        result.put("title", "HeartMirror 免责声明");
        result.put("content", """
                ## 重要声明

                HeartMirror（心镜）是一款心理健康自助管理工具，旨在帮助用户进行情绪管理和心理健康自我关护。

                ### 请注意：

                1. **非医疗诊断**：本产品不提供医疗诊断服务，所有评估结果仅供参考。

                2. **非替代治疗**：本产品不能替代专业心理咨询或治疗。

                3. **紧急情况**：如果您或他人正处于危机状态，请立即联系专业机构：
                   - 全国心理援助热线：400-161-9995
                   - 北京心理危机研究与干预中心：010-82951332
                   - 上海心理援助热线：021-34289888

                4. **数据安全**：我们采用端到端加密保护您的隐私数据。

                使用本产品即表示您已阅读并同意以上声明。
                """);
        result.put("version", "1.0.0");
        return result;
    }

    @Operation(summary = "危机资源")
    @GetMapping("/api/crisis/resources")
    public Map<String, Object> getCrisisResources() {
        Map<String, Object> result = new HashMap<>();
        result.put("hotline", crisisHotline);

        Map<String, String> resources = new HashMap<>();
        resources.put("beijing", "010-82951332");
        resources.put("shanghai", "021-34289888");
        resources.put("national", crisisHotline);
        result.put("resources", resources);

        result.put("message", "如果您正处于危机状态，请立即拨打以上热线寻求帮助。");
        return result;
    }
}
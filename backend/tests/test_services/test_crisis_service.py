"""
Test Crisis Service
危机支持服务测试
"""
import pytest
from app.services.crisis_service import CrisisService


class TestCrisisService:
    """危机支持服务测试类"""

    def test_get_crisis_resources(self):
        """测试获取危机资源"""
        resources = CrisisService.get_crisis_resources()
        assert len(resources) > 0
        assert resources[0]["phone"] == "400-161-9995"

    def test_get_immediate_actions(self):
        """测试获取立即行动建议"""
        actions = CrisisService.get_immediate_actions()
        assert len(actions) > 0
        assert "深呼吸" in actions[0]

    def test_get_safety_plan_template(self):
        """测试获取安全计划模板"""
        template = CrisisService.get_safety_plan_template()
        assert "step1" in template
        assert "step5" in template

    def test_is_high_risk(self):
        """测试高风险判断"""
        assert CrisisService.is_high_risk("red") == True
        assert CrisisService.is_high_risk("orange") == True
        assert CrisisService.is_high_risk("yellow") == False
        assert CrisisService.is_high_risk("green") == False

    def test_get_crisis_response_red(self):
        """测试高风险响应"""
        response = CrisisService.get_crisis_response("red")
        assert response["show_resources"] == True
        assert response["show_immediate_actions"] == True
        assert len(response["resources"]) > 0

    def test_get_crisis_response_green(self):
        """测试低风险响应"""
        response = CrisisService.get_crisis_response("green")
        assert response["show_resources"] == False
        assert response["show_immediate_actions"] == False
# HeartMirror 知识数据

## DSM-5症状数据

本目录包含DSM-5诊断标准的结构化数据，用于知识图谱构建。

### 数据文件

- `dsm5_symptoms.json` - DSM-5症状定义
- `intervention_db.json` - 干预方案数据库
- `crisis_resources.json` - 危机支持资源

### 数据格式

```json
{
  "disorders": {
    "depression": {
      "name": "抑郁症",
      "code": "F32",
      "symptoms": ["情绪低落", "兴趣减退", ...]
    }
  }
}
```

### 更新数据

运行以下命令更新知识库：

```bash
cd knowledge_base/scripts
python init_knowledge.py
```
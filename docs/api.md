# API 文档

## 基础信息

- 基础URL: `http://localhost:8000`
- API版本: v1
- 文档地址: `/docs` (Swagger UI), `/redoc` (ReDoc)

## 认证

所有需要认证的接口需在请求头中携带JWT令牌：

```
Authorization: Bearer <token>
```

## 接口列表

### 认证模块 `/api/auth`

#### 注册用户
```
POST /api/auth/register
```

请求体：
```json
{
  "anonymous_id": "string",
  "password": "string",
  "consent_given": true,
  "disclaimer_accepted": true
}
```

#### 登录
```
POST /api/auth/login
```

请求体：
```json
{
  "anonymous_id": "string",
  "password": "string"
}
```

#### 获取当前用户信息
```
GET /api/auth/me
```

### 对话模块 `/api/chat`

#### 创建对话会话
```
POST /api/chat/sessions
```

#### 获取会话列表
```
GET /api/chat/sessions
```

#### 发送消息
```
POST /api/chat/send
```

请求体：
```json
{
  "session_id": "uuid (optional)",
  "message": "string"
}
```

### 情绪模块 `/api/emotion`

#### 创建情绪记录
```
POST /api/emotion/record
```

请求体：
```json
{
  "primary_emotion": "string",
  "intensity": 0.5,
  "source_type": "manual",
  "context_tags": ["string"]
}
```

#### 获取情绪记录
```
GET /api/emotion/records?days=7&limit=50
```

#### 获取情绪统计
```
GET /api/emotion/stats?days=7
```

### 日记模块 `/api/diary`

#### 创建日记
```
POST /api/diary
```

请求体：
```json
{
  "content": "string",
  "mood": "string",
  "tags": ["string"]
}
```

#### 获取日记列表
```
GET /api/diary?limit=20&offset=0
```

#### 获取日记详情
```
GET /api/diary/{diary_id}
```

### 看板模块 `/api/dashboard`

#### 获取看板数据
```
GET /api/dashboard?days=30
```

### 危机支持模块 `/api/crisis`

#### 获取危机资源
```
GET /api/crisis/resources
```

#### 获取紧急热线
```
GET /api/crisis/hotline
```

#### 获取即时帮助
```
GET /api/crisis/immediate-help
```

## 错误响应

所有错误响应格式：
```json
{
  "detail": {
    "message": "错误描述",
    "code": "ERROR_CODE"
  }
}
```

常见错误码：
- 400: 请求参数错误
- 401: 未认证
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误
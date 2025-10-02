# GeoGebra HTTP 服务指南

## 🚀 **为什么选择 HTTP 服务？**

### **MCP 模式的问题**
- ❌ **每次启动都要 3-10 秒**：需要启动浏览器、加载 GeoGebra
- ❌ **资源消耗巨大**：每个实例占用 200-500MB 内存
- ❌ **无法复用**：每次请求都要重新初始化
- ❌ **并发性能差**：无法处理多个同时请求

### **HTTP 服务的优势**
- ✅ **启动一次，持续运行**：浏览器实例保持运行状态
- ✅ **快速响应**：首次请求后，后续请求几乎瞬时响应
- ✅ **资源复用**：多个请求共享同一个实例池
- ✅ **高并发支持**：支持同时处理多个请求
- ✅ **更好的监控**：提供健康检查、性能监控等端点

## 🛠 **快速开始**

### **1. 安装依赖**
```bash
npm install
```

### **2. 启动 HTTP 服务**
```bash
# 开发模式
npm run dev:http

# 生产模式
npm run build
npm run start:http
```

### **3. 验证服务**
```bash
# 健康检查
curl http://localhost:3000/health

# 查看服务状态
curl http://localhost:3000/status
```

## 📡 **API 接口**

### **基础端点**

#### **健康检查**
```bash
GET /health
```
返回服务健康状态和运行时间。

#### **服务状态**
```bash
GET /status
```
返回详细的服务状态，包括实例池信息、工具数量等。

#### **工具列表**
```bash
GET /tools
```
返回所有可用的 GeoGebra 工具。

### **GeoGebra 操作**

#### **执行命令**
```bash
POST /geogebra/command
Content-Type: application/json

{
  "command": "A = (1, 2)"
}
```

#### **导出 PNG**
```bash
POST /geogebra/export/png
Content-Type: application/json

{
  "scale": 2,
  "transparent": false,
  "dpi": 300,
  "width": 800,
  "height": 600
}
```

#### **导出 SVG**
```bash
POST /geogebra/export/svg
Content-Type: application/json

{}
```

#### **导出 PDF**
```bash
POST /geogebra/export/pdf
Content-Type: application/json

{}
```

### **工具执行**

#### **执行工具**
```bash
POST /tools/{toolName}
Content-Type: application/json

{
  "参数名": "参数值"
}
```

例如：
```bash
POST /tools/geogebra_create_point
Content-Type: application/json

{
  "name": "A",
  "x": 1,
  "y": 2
}
```

### **实例管理**

#### **获取实例信息**
```bash
GET /instances
```

#### **清理实例**
```bash
POST /instances/cleanup
```

#### **性能监控**
```bash
GET /performance
```

## 🔧 **配置选项**

### **环境变量**

```bash
# 服务端口
PORT=3000

# 最大实例数
MAX_INSTANCES=3

# 实例超时时间（毫秒）
INSTANCE_TIMEOUT=300000

# 最大空闲时间（毫秒）
MAX_IDLE_TIME=600000

# 日志级别
LOG_LEVEL=info

# CORS 来源
CORS_ORIGIN=*
```

### **性能调优**

```bash
# 生产环境推荐配置
MAX_INSTANCES=5
INSTANCE_TIMEOUT=600000
MAX_IDLE_TIME=1800000
LOG_LEVEL=warn
```

## 📊 **性能对比**

| 指标 | MCP 模式 | HTTP 服务 |
|------|----------|-----------|
| 首次启动时间 | 3-10 秒 | 3-10 秒 |
| 后续请求时间 | 3-10 秒 | 50-200ms |
| 内存占用 | 每次 200-500MB | 共享 200-500MB |
| 并发支持 | 不支持 | 支持 |
| 资源复用 | 无 | 高 |

## 🚀 **使用示例**

### **Python 客户端示例**

```python
import requests
import base64

# 创建点
response = requests.post('http://localhost:3000/geogebra/command', 
                        json={'command': 'A = (1, 2)'})
print(response.json())

# 导出 PNG
response = requests.post('http://localhost:3000/geogebra/export/png',
                        json={'scale': 2, 'transparent': False})
png_data = response.json()['data']

# 保存图片
with open('output.png', 'wb') as f:
    f.write(base64.b64decode(png_data))
```

### **JavaScript 客户端示例**

```javascript
// 创建几何图形
const createTriangle = async () => {
  const commands = [
    'A = (0, 0)',
    'B = (3, 0)', 
    'C = (1.5, 2.6)',
    'triangle = Polygon(A, B, C)'
  ];
  
  for (const command of commands) {
    await fetch('http://localhost:3000/geogebra/command', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({command})
    });
  }
};

// 导出图片
const exportImage = async () => {
  const response = await fetch('http://localhost:3000/geogebra/export/png', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({scale: 2})
  });
  
  const {data} = await response.json();
  return data; // base64 编码的 PNG 数据
};
```

## 🔍 **监控和调试**

### **健康检查**
```bash
curl http://localhost:3000/health
```

### **性能监控**
```bash
curl http://localhost:3000/performance
```

### **实例状态**
```bash
curl http://localhost:3000/instances
```

## 🚨 **故障排除**

### **常见问题**

1. **端口被占用**
   ```bash
   # 更改端口
   PORT=3001 npm run dev:http
   ```

2. **内存不足**
   ```bash
   # 减少实例数
   MAX_INSTANCES=1 npm run dev:http
   ```

3. **Chrome 启动失败**
   ```bash
   # 设置 Chrome 路径
   CHROME_EXECUTABLE_PATH=/path/to/chrome npm run dev:http
   ```

### **日志查看**
```bash
# 启用调试日志
LOG_LEVEL=debug npm run dev:http
```

## 🎯 **最佳实践**

1. **生产环境部署**
   - 使用 PM2 或 Docker 管理进程
   - 设置适当的实例池大小
   - 配置监控和告警

2. **性能优化**
   - 预热实例池
   - 定期清理空闲实例
   - 监控内存使用情况

3. **安全考虑**
   - 配置 CORS 策略
   - 添加认证和授权
   - 限制请求频率

## 📈 **总结**

HTTP 服务模式相比 MCP 模式有显著优势：

- **性能提升 10-20 倍**：从 3-10 秒降低到 50-200ms
- **资源利用率更高**：共享实例池，减少内存占用
- **更好的可扩展性**：支持高并发请求
- **更易监控和调试**：提供丰富的监控端点

对于生产环境和高频使用场景，强烈推荐使用 HTTP 服务模式！

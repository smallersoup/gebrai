# GeoGebra 文件导出 API 文档

## 🎯 **概述**

现在 HTTP 服务支持完整的文件导出功能，不仅返回 base64 数据，还可以直接保存为文件格式并提供下载链接。

## 📡 **API 端点**

### **1. 文件导出端点**

#### **PNG 文件导出**
```bash
POST /export/png
Content-Type: application/json

{
  "scale": 2,           // 可选，缩放比例，默认 1
  "transparent": false, // 可选，是否透明背景，默认 false
  "dpi": 300,          // 可选，DPI，默认 72
  "width": 800,        // 可选，宽度
  "height": 600,       // 可选，高度
  "filename": "my-image.png", // 可选，自定义文件名
  "outputDir": "/custom/path" // 可选，自定义输出目录
}
```

**响应示例：**
```json
{
  "success": true,
  "format": "png",
  "filename": "my-image.png",
  "filePath": "exports/my-image.png",
  "metadata": {
    "scale": 2,
    "transparent": false,
    "dpi": 300
  },
  "downloadUrl": "/download/my-image.png"
}
```

#### **SVG 文件导出**
```bash
POST /export/svg
Content-Type: application/json

{
  "filename": "my-diagram.svg", // 可选，自定义文件名
  "outputDir": "/custom/path"   // 可选，自定义输出目录
}
```

**响应示例：**
```json
{
  "success": true,
  "format": "svg",
  "filename": "my-diagram.svg",
  "filePath": "exports/my-diagram.svg",
  "downloadUrl": "/download/my-diagram.svg"
}
```

#### **PDF 文件导出**
```bash
POST /export/pdf
Content-Type: application/json

{
  "filename": "my-document.pdf", // 可选，自定义文件名
  "outputDir": "/custom/path"    // 可选，自定义输出目录
}
```

**响应示例：**
```json
{
  "success": true,
  "format": "pdf",
  "filename": "my-document.pdf",
  "filePath": "exports/my-document.pdf",
  "downloadUrl": "/download/my-document.pdf"
}
```

#### **通用导出端点**
```bash
POST /export/{format}
Content-Type: application/json

{
  "filename": "custom-name.ext",
  "outputDir": "/custom/path",
  // 格式特定参数...
}
```

支持的格式：`png`, `svg`, `pdf`

### **2. 文件管理端点**

#### **文件下载**
```bash
GET /download/{filename}
```

**响应：** 直接返回文件内容，带有适当的 Content-Type 头。

#### **文件列表**
```bash
GET /files
```

**响应示例：**
```json
{
  "files": [
    {
      "filename": "geogebra_2025-10-01T15-36-26-941Z_abc123.png",
      "size": 72973,
      "created": "2025-10-01T15:36:26.941Z",
      "modified": "2025-10-01T15:36:26.941Z",
      "downloadUrl": "/download/geogebra_2025-10-01T15-36-26-941Z_abc123.png"
    }
  ]
}
```

### **3. 传统端点（兼容性）**

#### **Base64 导出（不保存文件）**
```bash
POST /geogebra/export/png
POST /geogebra/export/svg  
POST /geogebra/export/pdf
```

这些端点仍然可用，只返回 base64 数据，不保存文件。

## 🔧 **配置选项**

### **环境变量**

```bash
# 导出文件保存目录
EXPORT_DIR=./exports

# 服务端口
PORT=3000

# 其他配置...
```

### **默认行为**

- **文件保存位置**：`./exports` 目录
- **文件名生成**：`{prefix}_{timestamp}_{random}.{ext}`
- **自动创建目录**：如果输出目录不存在会自动创建

## 📝 **使用示例**

### **Python 示例**

```python
import requests
import os

# 1. 创建几何图形
requests.post('http://localhost:3000/geogebra/command', 
              json={'command': 'A = (1, 2)'})
requests.post('http://localhost:3000/geogebra/command', 
              json={'command': 'B = (3, 4)'})
requests.post('http://localhost:3000/geogebra/command', 
              json={'command': 'line = Line(A, B)'})

# 2. 导出为 PNG 文件
response = requests.post('http://localhost:3000/export/png', json={
    'filename': 'my-line.png',
    'scale': 2,
    'dpi': 300
})

if response.json()['success']:
    print(f"文件已保存: {response.json()['filePath']}")
    print(f"下载链接: http://localhost:3000{response.json()['downloadUrl']}")

# 3. 下载文件
download_url = f"http://localhost:3000{response.json()['downloadUrl']}"
file_response = requests.get(download_url)
with open('downloaded-image.png', 'wb') as f:
    f.write(file_response.content)
```

### **JavaScript 示例**

```javascript
// 1. 创建几何图形
await fetch('http://localhost:3000/geogebra/command', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({command: 'A = (1, 2)'})
});

// 2. 导出为 SVG 文件
const exportResponse = await fetch('http://localhost:3000/export/svg', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    filename: 'my-diagram.svg'
  })
});

const exportData = await exportResponse.json();
if (exportData.success) {
  console.log(`文件已保存: ${exportData.filePath}`);
  
  // 3. 下载文件
  const downloadResponse = await fetch(`http://localhost:3000${exportData.downloadUrl}`);
  const blob = await downloadResponse.blob();
  
  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportData.filename;
  a.click();
}
```

### **cURL 示例**

```bash
# 1. 创建几何图形
curl -X POST http://localhost:3000/geogebra/command \
  -H "Content-Type: application/json" \
  -d '{"command": "A = (1, 2)"}'

# 2. 导出为 PDF 文件
curl -X POST http://localhost:3000/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"filename": "my-document.pdf"}'

# 3. 下载文件
curl -O http://localhost:3000/download/my-document.pdf

# 4. 查看文件列表
curl http://localhost:3000/files
```

## 🎨 **高级用法**

### **批量导出**

```python
import requests

# 创建多个图形
shapes = [
    'A = (0, 0)',
    'B = (3, 0)', 
    'C = (1.5, 2.6)',
    'triangle = Polygon(A, B, C)',
    'circle = Circle(A, 2)'
]

for command in shapes:
    requests.post('http://localhost:3000/geogebra/command', 
                  json={'command': command})

# 导出多种格式
formats = ['png', 'svg', 'pdf']
for fmt in formats:
    response = requests.post(f'http://localhost:3000/export/{fmt}', json={
        'filename': f'my-construction.{fmt}'
    })
    print(f"{fmt.upper()}: {response.json()['filePath']}")
```

### **自定义输出目录**

```python
# 导出到自定义目录
response = requests.post('http://localhost:3000/export/png', json={
    'filename': 'high-res-image.png',
    'outputDir': '/Users/username/Desktop/geogebra-exports',
    'scale': 3,
    'dpi': 600
})
```

## 🔍 **错误处理**

### **常见错误**

1. **文件格式不支持**
   ```json
   {"error": "Unsupported format: jpg"}
   ```

2. **文件未找到**
   ```json
   {"error": "File not found"}
   ```

3. **导出失败**
   ```json
   {"error": "PNG export failed: GeoGebra instance not ready"}
   ```

### **错误处理示例**

```python
import requests

try:
    response = requests.post('http://localhost:3000/export/png', json={
        'filename': 'test.png'
    })
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            print(f"导出成功: {data['filePath']}")
        else:
            print(f"导出失败: {data.get('error', 'Unknown error')}")
    else:
        print(f"HTTP 错误: {response.status_code}")
        
except requests.exceptions.RequestException as e:
    print(f"请求失败: {e}")
```

## 📊 **性能优化**

### **建议配置**

```bash
# 生产环境配置
MAX_INSTANCES=5
INSTANCE_TIMEOUT=600000
MAX_IDLE_TIME=1800000
EXPORT_DIR=/var/geogebra/exports
```

### **文件管理**

- 定期清理旧文件
- 监控磁盘空间使用
- 设置文件大小限制

## 🎯 **总结**

新的文件导出功能提供了：

✅ **完整的文件格式支持** - PNG, SVG, PDF  
✅ **灵活的文件命名** - 自定义文件名或自动生成  
✅ **多种输出选项** - 自定义目录、格式参数  
✅ **便捷的下载功能** - 直接下载链接  
✅ **文件管理** - 列表查看、状态监控  
✅ **向后兼容** - 保留原有的 base64 导出功能  

现在你可以轻松地将 GeoGebra 图形导出为各种文件格式，并直接保存到本地或通过 HTTP 下载！🎉

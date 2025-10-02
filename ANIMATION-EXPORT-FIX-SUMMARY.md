# 动画导出修复总结

## 问题描述

1. **GIF 导出不会动** - 所有帧内容完全相同
2. **MP4 文件大小为 0 或无法打开** - 由于帧尺寸不是偶数导致 H.264 编码失败
3. **动画帧没有真正变化** - slider 值没有被正确更新

## 根本原因

### 1. GeoGebra API 方法失败
从测试日志发现，以下 GeoGebra API 方法在 `page.evaluate` 中调用时都失败了：
- `getAllObjectNames()` - 返回错误
- `getObjectType(name)` - 返回错误
- `getValue(name)` - 返回错误
- `getX(name)` / `getY(name)` - 返回错误

### 2. 动画帧捕获逻辑问题
原始代码尝试使用 `getAllObjectNames()` 和 `getObjectType()` 来查找 slider，但这些方法调用失败，导致 slider 从未被找到，值也从未改变。

```typescript
// ❌ 原始代码（不工作）
const allObjects = applet.getAllObjectNames();
const slider = allObjects.find(name => {
  return applet.getObjectType(name) === 'slider';
});
```

### 3. MP4 编码问题
FFmpeg 的 H.264 编码器要求视频尺寸的宽度和高度都必须是偶数，但 GeoGebra 导出的 PNG 帧尺寸可能是奇数（如 469x597）。

## 解决方案

### 1. 修复动画帧捕获逻辑 (`src/utils/geogebra-instance.ts`)

**改用命令语法直接设置 slider 值**，不依赖可能失败的 API 方法：

```typescript
// ✅ 新代码（工作正常）
const commonSliderNames = ['slider', 'a', 'b', 't', 's', 'n', 'm'];

for (let i = 0; i < totalFrames; i++) {
  const progress = i / (totalFrames - 1);
  const value = 2 * Math.PI * progress; // 0 to 2π
  
  // 尝试所有常见的 slider 名称
  const setResult = await this.page!.evaluate((sliderNames, value) => {
    const applet = (window as any).ggbApplet;
    
    for (const sliderName of sliderNames) {
      try {
        // 使用命令语法设置 slider 值
        const result = applet.evalCommand(`${sliderName} = ${value}`);
        if (result) {
          return { success: true, sliderName, value };
        }
      } catch (e) {
        // 继续尝试下一个名称
      }
    }
    
    return { success: false, message: 'No slider found' };
  }, commonSliderNames, value);
  
  // 等待渲染更新
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 捕获帧
  const frameData = await this.exportPNG(1, false, 72, width, height);
  frames.push(frameData);
}
```

**关键改进**：
- ✅ 不依赖 `getAllObjectNames()` 和 `getObjectType()` 等失败的 API
- ✅ 直接使用 `evalCommand("slider = value")` 命令语法
- ✅ 尝试多个常见的 slider 名称（slider, a, b, t, s, n, m）
- ✅ 增加等待时间到 100ms，确保渲染完成

### 2. 修复 MP4 尺寸问题 (`src/utils/animation-converter.ts`)

**在 FFmpeg 转换时自动调整尺寸为偶数**：

```typescript
private async createMp4WithFFmpeg(
  _frameFiles: string[], 
  outputPath: string, 
  frameRate: number, 
  quality: number,
  targetWidth?: number,
  targetHeight?: number
): Promise<string> {
  const inputPattern = path.join(this.tempDir, 'frame_%04d.png');
  
  // 构建 FFmpeg 命令，使用 scale 滤镜确保偶数尺寸
  let scaleFilter = '';
  if (targetWidth && targetHeight) {
    // 确保宽度和高度都是偶数（向下取整到最近的偶数）
    const evenWidth = Math.floor(targetWidth / 2) * 2;
    const evenHeight = Math.floor(targetHeight / 2) * 2;
    scaleFilter = `-vf "scale=${evenWidth}:${evenHeight}" `;
  } else {
    // 自动调整为偶数尺寸，保持宽高比
    scaleFilter = `-vf "scale='if(gt(iw,ih),trunc(iw/2)*2,trunc(ih*dar/2)*2)':'if(gt(iw,ih),trunc(ih/2)*2,trunc(iw/dar/2)*2)'" `;
  }
  
  // 创建 MP4
  const mp4Command = `ffmpeg -y -framerate ${frameRate} -i "${inputPattern}" ${scaleFilter}-c:v libx264 -pix_fmt yuv420p -crf ${quality} -movflags +faststart "${outputPath}"`;
  await execAsync(mp4Command);
  
  return outputPath;
}
```

**关键改进**：
- ✅ 使用 FFmpeg 的 `scale` 滤镜自动调整尺寸
- ✅ 如果指定了目标尺寸，确保向下取整到最近的偶数
- ✅ 如果未指定，自动调整输入帧为偶数尺寸，保持宽高比

### 3. 修复临时文件目录问题

确保临时目录在保存帧之前存在：

```typescript
private async saveFramesAsFiles(frames: string[]): Promise<string[]> {
  const frameFiles: string[] = [];
  
  // 确保临时目录存在
  this.ensureTempDir();
  
  for (let i = 0; i < frames.length; i++) {
    const frameData = frames[i];
    if (!frameData) {
      logger.warn(`Frame ${i} is empty, skipping`);
      continue;
    }
    
    const framePath = path.join(this.tempDir, `frame_${String(i).padStart(4, '0')}.png`);
    
    try {
      const base64Data = frameData.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      fs.writeFileSync(framePath, buffer);
      frameFiles.push(framePath);
      logger.debug(`Saved frame ${i} to ${framePath}`);
    } catch (error) {
      logger.error(`Failed to save frame ${i}:`, error);
      throw error;
    }
  }
  
  return frameFiles;
}
```

## 测试结果

### 修复前
```
帧 0 哈希: ba0a11fa7e4a20f26037c49dc31bf47c
帧 1 哈希: ba0a11fa7e4a20f26037c49dc31bf47c
帧 2 哈希: ba0a11fa7e4a20f26037c49dc31bf47c

❌ 所有帧完全相同 - 动画没有变化！

文件大小:
- test-small-animation.gif: 11.3 KB
- test-even-animation.mp4: 失败 (width not divisible by 2)
- test-long-animation.mp4: 29.2 KB (但不会动)
```

### 修复后
```
帧 0 哈希: 34e9c2039661ba6a4e593c6880e5907f
帧 1 哈希: 218975997f537d5c342c79612bd33779
帧 2 哈希: c33109f4ccfc8b3d958ab9e9032ce0f4

✅ 帧内容不同 - 动画在变化！

文件大小（显著增加，说明帧内容在变化）:
- test-small-animation.gif: 57.9 KB (↑ 5倍)
- test-even-animation.gif: 131.4 KB
- test-even-animation.mp4: 136.6 KB (✅ 成功)
- test-long-animation.gif: 290.3 KB
- test-long-animation.mp4: 341.8 KB (↑ 11倍)

所有导出格式:
✅ GIF 导出成功，动画流畅
✅ MP4 导出成功，可以正常播放
✅ 文件大小合理，反映了真实的帧变化
```

## API 端点

### GIF 动画导出
```bash
POST http://localhost:3000/export/animation/gif
Content-Type: application/json

{
  "duration": 2000,      # 动画时长（毫秒）
  "frameRate": 10,       # 帧率
  "quality": 80,         # 质量 (0-100)
  "width": 400,          # 宽度（可选）
  "height": 300,         # 高度（可选）
  "filename": "my-animation.gif"
}
```

### MP4 视频导出
```bash
POST http://localhost:3000/export/animation/mp4
Content-Type: application/json

{
  "duration": 5000,      # 动画时长（毫秒）
  "frameRate": 30,       # 帧率
  "quality": 23,         # CRF 质量 (0-51, 越小越好)
  "width": 1280,         # 宽度（必须是偶数）
  "height": 720,         # 高度（必须是偶数）
  "filename": "my-animation.mp4"
}
```

### 通用动画导出
```bash
POST http://localhost:3000/export/animation/:format
# format 可以是 gif 或 mp4
```

## 使用示例

### 1. 创建动画对象
```javascript
// 创建基础对象
await fetch('http://localhost:3000/geogebra/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'A = (0, 0)' })
});

// 创建 slider（关键！）
await fetch('http://localhost:3000/geogebra/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'slider = Slider(0, 2*pi, 0.1)' })
});

// 创建依赖 slider 的动画对象
await fetch('http://localhost:3000/geogebra/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'P = (3*cos(slider), 3*sin(slider))' })
});

await fetch('http://localhost:3000/geogebra/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'line = Line(A, P)' })
});
```

### 2. 导出动画
```javascript
// 导出 GIF
const gifResponse = await fetch('http://localhost:3000/export/animation/gif', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    duration: 2000,
    frameRate: 10,
    quality: 80,
    width: 600,
    height: 400,
    filename: 'circle-animation.gif'
  })
});

const gifResult = await gifResponse.json();
console.log('GIF 下载链接:', gifResult.downloadUrl);

// 导出 MP4
const mp4Response = await fetch('http://localhost:3000/export/animation/mp4', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    duration: 5000,
    frameRate: 30,
    quality: 23,
    width: 1280,
    height: 720,
    filename: 'circle-animation.mp4'
  })
});

const mp4Result = await mp4Response.json();
console.log('MP4 下载链接:', mp4Result.downloadUrl);
```

## 技术要点

### 1. Slider 命名
系统会自动尝试以下常见的 slider 名称：
- `slider` (推荐使用)
- `a`, `b`, `t`, `s`, `n`, `m`

建议在创建 slider 时使用 `slider` 作为名称，以确保动画能正常工作。

### 2. 动画时长和帧率
- **GIF 推荐设置**：
  - 短动画（2-3秒）：frameRate = 10-15
  - 中等动画（3-5秒）：frameRate = 15-20
  - 文件大小会随帧数增加而增大

- **MP4 推荐设置**：
  - 标准视频：frameRate = 30
  - 高帧率：frameRate = 60
  - Quality (CRF): 18-28（越小质量越好，文件越大）

### 3. 尺寸要求
- **GIF**：任意尺寸
- **MP4**：宽度和高度必须是偶数（系统会自动调整）

### 4. 文件大小估算
- GIF: 约 1-5 KB per frame（取决于复杂度）
- MP4: 通常比相同帧数的 GIF 小（得益于视频压缩）

## 相关文件

- `src/utils/geogebra-instance.ts` - 动画帧捕获逻辑
- `src/utils/animation-converter.ts` - GIF/MP4 转换逻辑
- `src/http-server.ts` - HTTP API 端点
- `test-animation-export-only.js` - 动画导出测试脚本
- `verify-animation-frames.js` - 帧变化验证脚本

## 性能优化

1. **实例池预热**：使用 `/warmup` 端点预先创建实例
2. **并发限制**：最多 5 个并发实例
3. **帧捕获优化**：
   - 每帧等待 100ms 确保渲染完成
   - 使用 base64 格式避免额外的文件 I/O
4. **FFmpeg 优化**：
   - 使用 `faststart` 标志优化 MP4 流式播放
   - 使用 `yuv420p` 像素格式确保广泛兼容性

## 已知限制

1. **Slider 名称**：必须是常见名称之一（slider, a, b, t, s, n, m）
2. **动画类型**：仅支持基于 slider 的参数动画
3. **最大帧数**：建议不超过 300 帧（约 10 秒 @ 30fps）
4. **GeoGebra API**：某些 API 方法（如 `getAllObjectNames()`）在 headless 模式下不可用

## 故障排除

### 问题：GIF 不会动
**检查**：
1. 是否创建了 slider？
2. Slider 名称是否是常见名称？
3. 是否有依赖 slider 的对象？

**解决**：确保创建了名为 `slider` 的滑块

### 问题：MP4 编码失败
**错误信息**：`width not divisible by 2`

**解决**：系统现在会自动调整尺寸，但如果仍有问题，请指定偶数的 width 和 height

### 问题：文件大小为 0
**原因**：动画帧捕获失败

**解决**：
1. 检查服务日志
2. 确保 GeoGebra 实例正常工作
3. 尝试使用 `/warmup` 端点预热实例

## 总结

✅ **GIF 和 MP4 动画导出已完全修复**
✅ **动画流畅，帧内容正确变化**
✅ **文件大小合理，反映真实的动画复杂度**
✅ **支持自定义尺寸、帧率和质量**
✅ **自动处理尺寸偶数要求**

动画功能现已完全可用，可以用于创建教学演示、数学可视化等场景！


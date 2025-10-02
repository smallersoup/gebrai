#!/usr/bin/env node

/**
 * 专门测试 GIF 和 MP4 动画导出的脚本
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAnimationExport() {
  console.log('🎬 测试 GIF 和 MP4 动画导出...\n');

  try {
    // 1. 创建动画对象
    console.log('1️⃣ 创建动画对象...');
    const commands = [
      'A = (0, 0)',
      'slider = Slider(0, 2*pi, 0.1)',
      'P = (3*cos(slider), 3*sin(slider))',
      'line = Line(A, P)',
      'circle = Circle(A, 3)'
    ];
    
    for (const command of commands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
        return;
      }
    }
    console.log('');

    // 2. 测试 GIF 导出（较小尺寸）
    console.log('2️⃣ 测试 GIF 导出（较小尺寸）...');
    const gifResult = await testEndpoint('/export/animation/gif', 'POST', {
      duration: 2000,
      frameRate: 10,
      quality: 80,
      width: 400,
      height: 300,
      filename: 'test-small-animation.gif'
    });
    
    if (gifResult.status === 200 && gifResult.data.success) {
      console.log(`   ✅ GIF 导出成功`);
      console.log(`   文件名: ${gifResult.data.filename}`);
      console.log(`   帧数: ${gifResult.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(gifResult.data.metadata.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${gifResult.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ GIF 导出失败: ${gifResult.data.error}\n`);
    }

    // 3. 测试 GIF 导出（偶数尺寸）
    console.log('3️⃣ 测试 GIF 导出（偶数尺寸 - 用于 MP4）...');
    const gifEvenResult = await testEndpoint('/export/animation/gif', 'POST', {
      duration: 2000,
      frameRate: 10,
      quality: 80,
      width: 800,  // 偶数
      height: 600, // 偶数
      filename: 'test-even-animation.gif'
    });
    
    if (gifEvenResult.status === 200 && gifEvenResult.data.success) {
      console.log(`   ✅ GIF 导出成功（偶数尺寸）`);
      console.log(`   文件名: ${gifEvenResult.data.filename}`);
      console.log(`   帧数: ${gifEvenResult.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(gifEvenResult.data.metadata.fileSize / 1024).toFixed(1)} KB\n`);
    } else {
      console.log(`   ❌ GIF 导出失败: ${gifEvenResult.data.error}\n`);
    }

    // 4. 测试 MP4 导出（偶数尺寸）
    console.log('4️⃣ 测试 MP4 导出（偶数尺寸）...');
    const mp4Result = await testEndpoint('/export/animation/mp4', 'POST', {
      duration: 2000,
      frameRate: 30,
      quality: 23,
      width: 800,  // 偶数
      height: 600, // 偶数
      filename: 'test-even-animation.mp4'
    });
    
    if (mp4Result.status === 200 && mp4Result.data.success) {
      console.log(`   ✅ MP4 导出成功`);
      console.log(`   文件名: ${mp4Result.data.filename}`);
      console.log(`   帧数: ${mp4Result.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(mp4Result.data.metadata.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${mp4Result.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ MP4 导出失败: ${mp4Result.data.error}\n`);
    }

    // 5. 测试长动画 GIF
    console.log('5️⃣ 测试长动画 GIF（5秒）...');
    const longGifResult = await testEndpoint('/export/animation/gif', 'POST', {
      duration: 5000,
      frameRate: 15,
      quality: 80,
      width: 600,
      height: 400,
      filename: 'test-long-animation.gif'
    });
    
    if (longGifResult.status === 200 && longGifResult.data.success) {
      console.log(`   ✅ 长动画 GIF 导出成功`);
      console.log(`   文件名: ${longGifResult.data.filename}`);
      console.log(`   帧数: ${longGifResult.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(longGifResult.data.metadata.fileSize / 1024).toFixed(1)} KB\n`);
    } else {
      console.log(`   ❌ 长动画 GIF 导出失败: ${longGifResult.data.error}\n`);
    }

    // 6. 测试长动画 MP4
    console.log('6️⃣ 测试长动画 MP4（5秒）...');
    const longMp4Result = await testEndpoint('/export/animation/mp4', 'POST', {
      duration: 5000,
      frameRate: 30,
      quality: 23,
      width: 1280, // 偶数
      height: 720,  // 偶数
      filename: 'test-long-animation.mp4'
    });
    
    if (longMp4Result.status === 200 && longMp4Result.data.success) {
      console.log(`   ✅ 长动画 MP4 导出成功`);
      console.log(`   文件名: ${longMp4Result.data.filename}`);
      console.log(`   帧数: ${longMp4Result.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(longMp4Result.data.metadata.fileSize / 1024).toFixed(1)} KB\n`);
    } else {
      console.log(`   ❌ 长动画 MP4 导出失败: ${longMp4Result.data.error}\n`);
    }

    console.log('✅ 动画导出测试完成！');
    console.log('\n📁 导出的文件:');
    console.log('   - test-small-animation.gif');
    console.log('   - test-even-animation.gif');
    console.log('   - test-even-animation.mp4');
    console.log('   - test-long-animation.gif');
    console.log('   - test-long-animation.mp4');
    console.log('\n💡 请手动打开 GIF 文件检查动画是否真的在动');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 检查服务是否运行
async function checkService() {
  try {
    await testEndpoint('/health');
    return true;
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 检查服务状态...');
  
  const isRunning = await checkService();
  if (!isRunning) {
    console.log('❌ HTTP 服务未运行！');
    console.log('请先启动服务: npm run dev:http');
    process.exit(1);
  }

  console.log('✅ 服务正在运行，开始测试...\n');
  await testAnimationExport();
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * 深度调试动画问题的脚本
 * 检查动画是否真正运行，帧是否真的不同
 */

const http = require('http');
const fs = require('fs');

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

async function debugAnimation() {
  console.log('🔍 深度调试动画问题...\n');

  try {
    // 1. 创建简单的动画并检查对象
    console.log('1️⃣ 创建动画并检查对象...');
    const commands = [
      'A = (0, 0)',
      'slider = Slider(0, 2*pi, 0.1)',
      'P = (2*cos(slider), 2*sin(slider))',
      'line = Line(A, P)'
    ];
    
    for (const command of commands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status !== 200) {
        console.log(`   ❌ 命令执行失败: ${command}`);
        return;
      }
    }
    console.log('   ✅ 动画对象创建成功\n');

    // 2. 检查对象列表
    console.log('2️⃣ 检查对象列表...');
    const objectsResult = await testEndpoint('/geogebra/objects');
    if (objectsResult.status === 200) {
      console.log('   对象列表:');
      objectsResult.data.objects.forEach(obj => {
        console.log(`   - ${obj.name}: ${obj.type}`);
      });
    }
    console.log('');

    // 3. 手动启动动画
    console.log('3️⃣ 手动启动动画...');
    const animationCommands = [
      'SetAnimating(slider, true)',
      'SetAnimationSpeed(slider, 1)',
      'StartAnimation()'
    ];
    
    for (const command of animationCommands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status !== 200) {
        console.log(`   ⚠️  动画命令执行失败: ${command}`);
      } else {
        console.log(`   ✅ 动画命令成功: ${command}`);
      }
    }
    console.log('');

    // 4. 等待动画运行并检查位置变化
    console.log('4️⃣ 检查动画是否运行...');
    const positions = [];
    for (let i = 0; i < 5; i++) {
      const posResult = await testEndpoint('/geogebra/command', 'POST', { 
        command: 'GetValue(P)' 
      });
      if (posResult.status === 200) {
        positions.push(posResult.data.result);
        console.log(`   位置 ${i + 1}: ${posResult.data.result}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 检查位置是否变化
    const uniquePositions = [...new Set(positions)];
    if (uniquePositions.length > 1) {
      console.log('   ✅ 动画正在运行 - 位置在变化');
    } else {
      console.log('   ❌ 动画没有运行 - 位置没有变化');
    }
    console.log('');

    // 5. 导出动画并分析帧
    console.log('5️⃣ 导出动画并分析帧...');
    const animationResult = await testEndpoint('/export/animation/gif', 'POST', {
      duration: 3000,  // 3秒
      frameRate: 10,   // 10fps
      quality: 80,
      width: 400,
      height: 300,
      filename: 'debug-animation.gif'
    });
    
    if (animationResult.status === 200 && animationResult.data.success) {
      console.log(`   ✅ 动画导出成功`);
      console.log(`   文件名: ${animationResult.data.filename}`);
      console.log(`   帧数: ${animationResult.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(animationResult.data.metadata.fileSize / 1024).toFixed(1)} KB`);
      
      // 6. 分析 GIF 文件
      const filePath = `./exports/${animationResult.data.filename}`;
      if (fs.existsSync(filePath)) {
        console.log('\n6️⃣ 分析 GIF 文件...');
        const fileBuffer = fs.readFileSync(filePath);
        const fileSize = fileBuffer.length;
        
        console.log(`   文件大小: ${(fileSize / 1024).toFixed(1)} KB`);
        console.log(`   文件头: ${fileBuffer.slice(0, 10).toString('hex')}`);
        
        // 检查是否有多个图像描述符（表示多帧）
        const imageDescriptorCount = (fileBuffer.toString('binary').match(/\x21\xF9/g) || []).length;
        console.log(`   图像描述符数量: ${imageDescriptorCount}`);
        
        if (imageDescriptorCount > 1) {
          console.log('   ✅ GIF 包含多帧 - 应该是动画');
        } else {
          console.log('   ❌ GIF 只有一帧 - 不是动画');
        }
        
        // 检查文件内容的变化
        const chunks = [];
        for (let i = 0; i < fileBuffer.length; i += 1000) {
          chunks.push(fileBuffer.slice(i, i + 1000));
        }
        
        const uniqueChunks = [...new Set(chunks.map(chunk => chunk.toString('hex')))];
        console.log(`   唯一块数量: ${uniqueChunks.length}/${chunks.length}`);
        
        if (uniqueChunks.length > chunks.length * 0.8) {
          console.log('   ✅ 文件内容有变化 - 可能是动画');
        } else {
          console.log('   ❌ 文件内容变化很少 - 可能不是动画');
        }
      }
    } else {
      console.log(`   ❌ 动画导出失败: ${animationResult.data.error}`);
    }

    console.log('\n✅ 动画调试完成！');
    console.log('\n📝 诊断结果:');
    console.log('   1. 如果位置没有变化，说明动画没有启动');
    console.log('   2. 如果 GIF 只有一帧，说明帧捕获有问题');
    console.log('   3. 如果文件内容变化很少，说明所有帧都相同');

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
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

  console.log('✅ 服务正在运行，开始调试...\n');
  await debugAnimation();
}

main().catch(console.error);
#!/usr/bin/env node

/**
 * 详细测试动画的脚本
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

async function testDetailedAnimation() {
  console.log('🔧 详细测试动画...\n');

  try {
    // 1. 创建简单的动画
    console.log('1️⃣ 创建简单动画...');
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
    console.log('   ✅ 动画创建成功\n');

    // 2. 测试不同的位置获取方法
    console.log('2️⃣ 测试位置获取方法...\n');
    
    // 方案1: 创建命名对象 + 查询（GeoGebra命令方式）
    console.log('   📝 方案1: 创建命名对象 + 查询');
    const objectDefinitions = [
      { create: 'xCoord = x(P)', query: 'xCoord', desc: 'P的x坐标' },
      { create: 'yCoord = y(P)', query: 'yCoord', desc: 'P的y坐标' },
      { create: 'midPt = Midpoint(A, P)', query: 'midPt', desc: 'A和P的中点' },
      { create: 'dist = Distance(A, P)', query: 'dist', desc: 'A到P的距离' },
      { create: 'sliderValue = slider', query: 'sliderValue', desc: 'slider的当前值' }
    ];
    
    for (const test of objectDefinitions) {
      // 步骤1: 创建对象
      const createResult = await testEndpoint('/geogebra/command', 'POST', { 
        command: test.create 
      });
      
      if (createResult.status === 200 && createResult.data.success) {
        // 步骤2: 查询对象值
        const queryResult = await testEndpoint('/geogebra/command', 'POST', { 
          command: test.query 
        });
        
        if (queryResult.status === 200) {
          const value = queryResult.data.result;
          console.log(`      ✅ ${test.desc}: ${value !== undefined && value !== null ? value : '(未定义)'}`);
        } else {
          console.log(`      ❌ ${test.desc}: 查询失败`);
        }
      } else {
        console.log(`      ❌ ${test.desc}: 创建失败`);
      }
    }
    
    console.log('\n   📝 方案2: 直接查询对象（尝试直接引用）');
    // 方案2: 尝试直接查询对象（这种方式对于点会返回null）
    const directQueries = ['P', 'A', 'slider', 'line'];
    
    for (const objName of directQueries) {
      const result = await testEndpoint('/geogebra/command', 'POST', { 
        command: objName 
      });
      
      if (result.status === 200) {
        const value = result.data.result;
        console.log(`      ✅ ${objName}: ${value !== undefined && value !== null ? value : '(点对象无直接值)'}`);
      } else {
        console.log(`      ❌ ${objName}: 失败`);
      }
    }
    console.log('');

    // 3. 手动改变 slider 值并检查位置
    console.log('3️⃣ 手动改变 slider 值并监测P点位置...');
    const testValues = [
      { value: 0, label: '0' },
      { value: Math.PI/2, label: 'π/2' },
      { value: Math.PI, label: 'π' },
      { value: 3*Math.PI/2, label: '3π/2' },
      { value: 2*Math.PI, label: '2π' }
    ];
    
    for (const test of testValues) {
      console.log(`\n   设置 slider = ${test.label} (${test.value.toFixed(4)})...`);
      
      const setValueResult = await testEndpoint('/geogebra/command', 'POST', { 
        command: `slider = ${test.value}` 
      });
      
      if (setValueResult.status === 200) {
        // 等待值设置生效
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 使用正确的方法：创建临时对象来获取坐标
        const xResult = await testEndpoint('/geogebra/command', 'POST', { 
          command: 'tempX = x(P)' 
        });
        const yResult = await testEndpoint('/geogebra/command', 'POST', { 
          command: 'tempY = y(P)' 
        });
        
        if (xResult.status === 200 && yResult.status === 200) {
          // 查询临时对象的值
          const xQuery = await testEndpoint('/geogebra/command', 'POST', { 
            command: 'tempX' 
          });
          const yQuery = await testEndpoint('/geogebra/command', 'POST', { 
            command: 'tempY' 
          });
          
          if (xQuery.status === 200 && yQuery.status === 200) {
            const x = xQuery.data.result;
            const y = yQuery.data.result;
            console.log(`     ✅ P的位置: (${x}, ${y})`);
            
            // 预期值（基于公式 P = (2*cos(slider), 2*sin(slider))）
            const expectedX = (2 * Math.cos(test.value)).toFixed(4);
            const expectedY = (2 * Math.sin(test.value)).toFixed(4);
            console.log(`     📊 预期位置: (${expectedX}, ${expectedY})`);
          } else {
            console.log(`     ❌ 查询坐标失败`);
          }
        } else {
          console.log(`     ❌ 获取位置失败`);
        }
        
        // 同时获取距离信息
        const distResult = await testEndpoint('/geogebra/command', 'POST', { 
          command: 'currentDist = Distance(A, P)' 
        });
        
        if (distResult.status === 200) {
          const distQuery = await testEndpoint('/geogebra/command', 'POST', { 
            command: 'currentDist' 
          });
          
          if (distQuery.status === 200) {
            console.log(`     📏 距离原点: ${distQuery.data.result}`);
          }
        }
      } else {
        console.log(`     ❌ 设置 slider 失败`);
      }
    }
    console.log('');

    // 4. 导出动画
    console.log('4️⃣ 导出动画...');
    const animationResult = await testEndpoint('/export/animation/gif', 'POST', {
      duration: 2000,  // 2秒
      frameRate: 10,   // 10fps
      quality: 80,
      width: 400,
      height: 300,
      filename: 'detailed-animation.gif'
    });
    
    if (animationResult.status === 200 && animationResult.data.success) {
      console.log(`   ✅ 动画导出成功`);
      console.log(`   文件名: ${animationResult.data.filename}`);
      console.log(`   帧数: ${animationResult.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(animationResult.data.metadata.fileSize / 1024).toFixed(1)} KB\n`);
    } else {
      console.log(`   ❌ 动画导出失败: ${animationResult.data.error}\n`);
    }

    console.log('✅ 详细动画测试完成！');

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
  await testDetailedAnimation();
}

main().catch(console.error);

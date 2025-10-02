#!/usr/bin/env node

/**
 * 测试命令响应格式的脚本
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

async function testCommandResponse() {
  console.log('🔧 测试命令响应格式...\n');

  try {
    // 1. 创建简单对象
    console.log('1️⃣ 创建简单对象...');
    const commands = [
      'A = (0, 0)',
      'B = (1, 1)',
      'slider = Slider(0, 2*pi, 0.1)'
    ];
    
    for (const command of commands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      console.log(`   命令: ${command}`);
      console.log(`   状态: ${result.status}`);
      console.log(`   响应: ${JSON.stringify(result.data, null, 2)}`);
      console.log('');
    }

    // 2. 测试获取对象值
    console.log('2️⃣ 测试获取对象值...');
    const getCommands = ['A', 'B', 'slider'];
    
    for (const command of getCommands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      console.log(`   命令: ${command}`);
      console.log(`   状态: ${result.status}`);
      console.log(`   响应: ${JSON.stringify(result.data, null, 2)}`);
      console.log('');
    }

    // 3. 测试计算命令
    console.log('3️⃣ 测试计算命令...');
    const calcCommands = [
      '2 + 3',
      'sin(pi/2)',
      'cos(0)'
    ];
    
    for (const command of calcCommands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      console.log(`   命令: ${command}`);
      console.log(`   状态: ${result.status}`);
      console.log(`   响应: ${JSON.stringify(result.data, null, 2)}`);
      console.log('');
    }

    console.log('✅ 命令响应测试完成！');

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
  await testCommandResponse();
}

main().catch(console.error);

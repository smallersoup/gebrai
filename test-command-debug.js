#!/usr/bin/env node

/**
 * 测试 GeoGebra 命令执行问题的诊断脚本
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testCommand(path, method = 'GET', data = null) {
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

async function runCommandDiagnostics() {
  console.log('🔍 开始 GeoGebra 命令诊断...\n');

  try {
    // 1. 检查服务状态
    console.log('1️⃣ 检查服务状态...');
    const healthResult = await testCommand('/health');
    console.log(`   健康状态: ${healthResult.status === 200 ? '✅ 正常' : '❌ 异常'}`);

    // 2. 检查实例池状态
    console.log('\n2️⃣ 检查实例池状态...');
    const instancesResult = await testCommand('/instances');
    if (instancesResult.status === 200) {
      const instances = instancesResult.data.instances || [];
      console.log(`   总实例数: ${instances.length}`);
      console.log(`   活跃实例: ${instances.filter(i => i.isActive).length}`);
      console.log(`   可用实例: ${instances.filter(i => !i.isActive).length}`);
    }

    // 3. 测试简单命令
    console.log('\n3️⃣ 测试简单命令...');
    const simpleCommands = [
      'A = (1, 2)',
      'B = (3, 4)', 
      'C = (2, 1)'
    ];

    for (const cmd of simpleCommands) {
      const result = await testCommand('/geogebra/command', 'POST', { command: cmd });
      console.log(`   ${cmd}: ${result.status === 200 && result.data.success ? '✅ 成功' : '❌ 失败'}`);
    }

    // 4. 测试复杂命令的不同语法
    console.log('\n4️⃣ 测试复杂命令的不同语法...');
    const complexCommands = [
      // 标准语法，创建三角形
      'triangle = Polygon(A, B, C)',
      // 直接使用坐标，创建三角形
      'triangle = Polygon((1,2), (3,4), (2,1))',
      'triangle = Polygon({A, B, C})',
      'triangle = Polygon[A, B, C]',
    ];

    for (const cmd of complexCommands) {
      const result = await testCommand('/geogebra/command', 'POST', { command: cmd });
      console.log(`   ${cmd}: ${result.status === 200 && result.data.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.status !== 200 || !result.data.success) {
        console.log(`      错误: ${result.data.error || '未知错误'}`);
      }
    }

    // 5. 测试其他几何命令
    console.log('\n5️⃣ 测试其他几何命令...');
    const geometryCommands = [
      'line = Line(A, B)',
      'line = Line((1,2), (3,4))',
      'circle = Circle(A, 2)',
      'circle = Circle((1,2), 2)',
      'segment = Segment(A, B)',
      'segment = Segment((1,2), (3,4))'
    ];

    for (const cmd of geometryCommands) {
      const result = await testCommand('/geogebra/command', 'POST', { command: cmd });
      console.log(`   ${cmd}: ${result.status === 200 && result.data.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.status !== 200 || !result.data.success) {
        console.log(`      错误: ${result.data.error || '未知错误'}`);
      }
    }

    // 6. 检查最终实例状态
    console.log('\n6️⃣ 检查最终实例状态...');
    const finalInstancesResult = await testCommand('/instances');
    if (finalInstancesResult.status === 200) {
      const instances = finalInstancesResult.data.instances || [];
      console.log(`   总实例数: ${instances.length}`);
      console.log(`   活跃实例: ${instances.filter(i => i.isActive).length}`);
      console.log(`   可用实例: ${instances.filter(i => !i.isActive).length}`);
      
      instances.forEach(instance => {
        console.log(`   - ${instance.id}: ${instance.isActive ? '活跃' : '可用'} (使用次数: ${instance.usageCount})`);
      });
    }

    console.log('\n✅ 诊断完成！');

  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  }
}

// 检查服务是否运行
async function checkService() {
  try {
    await testCommand('/health');
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

  console.log('✅ 服务正在运行，开始诊断...\n');
  await runCommandDiagnostics();
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * 测试 HTTP 服务的简单脚本
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试函数
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

// 运行测试
async function runTests() {
  console.log('🧪 开始测试 HTTP 服务...\n');

  try {
    // 1. 健康检查
    console.log('1️⃣ 测试健康检查...');
    const health = await testEndpoint('/health');
    console.log(`   状态: ${health.status}`);
    console.log(`   响应: ${JSON.stringify(health.data, null, 2)}\n`);

    // 2. 服务状态
    console.log('2️⃣ 测试服务状态...');
    const status = await testEndpoint('/status');
    console.log(`   状态: ${status.status}`);
    console.log(`   工具数量: ${status.data.tools?.count || 'N/A'}\n`);

    // 3. 创建基础点
    console.log('3️⃣ 创建基础几何对象 - 点...');
    const points = [
      'A = (0, 0)',
      'B = (3, 0)',
      'C = (1.5, 2.6)',
      'D = (5, 2)',
      'E = (2, -1)'
    ];
    
    for (const command of points) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
      }
    }
    console.log('');

    // 4. 创建线段和直线
    console.log('4️⃣ 创建线段和直线...');
    const lines = [
      'segment1 = Segment(A, B)',
      'segment2 = Segment(B, C)',
      'segment3 = Segment(C, A)',
      'line1 = Line(A, D)',
      'line2 = Line(B, E)'
    ];
    
    for (const command of lines) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
      }
    }
    console.log('');

    // 5. 创建多边形
    console.log('5️⃣ 创建多边形...');
    const polygons = [
      'triangle = Polygon(A, B, C)',
      'F = (6, 0)',
      'G = (8, 0)',
      'H = (8, 2)',
      'I = (6, 2)',
      'rectangle = Polygon(F, G, H, I)'
    ];
    
    for (const command of polygons) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
      }
    }
    console.log('');

    // 6. 创建圆
    console.log('6️⃣ 创建圆...');
    const circles = [
      'circle1 = Circle(A, 2)',
      'circle2 = Circle(D, 1.5)',
      'J = (10, 1)',
      'K = (12, 1)',
      'circle3 = Circle(J, K)'
    ];
    
    for (const command of circles) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
      }
    }
    console.log('');

    // 7. 创建函数
    console.log('7️⃣ 创建函数曲线...');
    const functions = [
      'f(x) = x^2',
      'g(x) = sin(x)',
      'h(x) = cos(x)',
      'k(x) = 1/x'
    ];
    
    for (const command of functions) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
      }
    }
    console.log('');

    // 8. 导出 PNG 文件
    console.log('8️⃣ 导出 PNG 文件...');
    const pngFile = await testEndpoint('/export/png', 'POST', {
      scale: 1,
      transparent: false,
      dpi: 72,
      width: 800,
      height: 600,
      filename: 'test-geometry.png'
    });
    if (pngFile.status === 200 && pngFile.data.success) {
      console.log(`   ✅ PNG 文件导出成功`);
      console.log(`   文件名: ${pngFile.data.filename}`);
      console.log(`   文件大小: ${(pngFile.data.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${pngFile.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ PNG 文件导出失败\n`);
    }

    // 9. 导出 SVG 文件
    console.log('9️⃣ 导出 SVG 文件...');
    const svgFile = await testEndpoint('/export/svg', 'POST', {
      filename: 'test-geometry.svg'
    });
    if (svgFile.status === 200 && svgFile.data.success) {
      console.log(`   ✅ SVG 文件导出成功`);
      console.log(`   文件名: ${svgFile.data.filename}`);
      console.log(`   文件大小: ${(svgFile.data.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${svgFile.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ SVG 文件导出失败: ${svgFile.data.error}\n`);
    }

    // 10. 导出 PDF 文件
    console.log('🔟 导出 PDF 文件...');
    const pdfFile = await testEndpoint('/export/pdf', 'POST', {
      filename: 'test-geometry.pdf'
    });
    if (pdfFile.status === 200 && pdfFile.data.success) {
      console.log(`   ✅ PDF 文件导出成功`);
      console.log(`   文件名: ${pdfFile.data.filename}`);
      console.log(`   文件大小: ${(pdfFile.data.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${pdfFile.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ PDF 文件导出失败: ${pdfFile.data.error}\n`);
    }

    // 11. 创建动画对象并导出 GIF
    console.log('1️⃣1️⃣ 创建动画对象并导出 GIF...');
    const animationCommands = [
      'A = (0, 0)',  // ✅ 确保点 A 存在（修复 Line 命令失败问题）
      'slider = Slider(0, 2*pi, 0.1)',
      'P = (3*cos(slider), 3*sin(slider))',
      'animLine = Line(A, P)'
    ];
    
    for (const command of animationCommands) {
      const result = await testEndpoint('/geogebra/command', 'POST', { command });
      if (result.status === 200 && result.data.success) {
        console.log(`   ✅ ${command}`);
      } else {
        console.log(`   ❌ ${command} 失败`);
        if (result.data && result.data.error) {
          console.log(`      错误: ${result.data.error}`);
        }
      }
    }
    
    const gifFile = await testEndpoint('/export/animation/gif', 'POST', {
      duration: 3000,
      frameRate: 15,
      quality: 80,
      width: 800,
      height: 600,
      filename: 'test-animation.gif'
    });
    if (gifFile.status === 200 && gifFile.data.success) {
      console.log(`   ✅ GIF 动画导出成功`);
      console.log(`   文件名: ${gifFile.data.filename}`);
      console.log(`   帧数: ${gifFile.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(gifFile.data.metadata.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${gifFile.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ GIF 动画导出失败: ${gifFile.data.error}\n`);
    }

    // 12. 导出 MP4 视频
    console.log('1️⃣2️⃣ 导出 MP4 视频...');
    const mp4File = await testEndpoint('/export/animation/mp4', 'POST', {
      duration: 3000,
      frameRate: 30,
      quality: 23,
      width: 800,
      height: 600,
      filename: 'test-animation.mp4'
    });
    if (mp4File.status === 200 && mp4File.data.success) {
      console.log(`   ✅ MP4 视频导出成功`);
      console.log(`   文件名: ${mp4File.data.filename}`);
      console.log(`   帧数: ${mp4File.data.metadata.frameCount}`);
      console.log(`   文件大小: ${(mp4File.data.metadata.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   下载链接: ${mp4File.data.downloadUrl}\n`);
    } else {
      console.log(`   ❌ MP4 视频导出失败: ${mp4File.data.error}\n`);
    }

    // 13. 列出所有导出的文件
    console.log('1️⃣3️⃣ 列出所有导出的文件...');
    const files = await testEndpoint('/files');
    if (files.status === 200 && files.data.success) {
      console.log(`   ✅ 文件列表获取成功`);
      console.log(`   文件数量: ${files.data.files.length}`);
      files.data.files.forEach(file => {
        console.log(`   - ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log(`   ❌ 文件列表获取失败`);
    }
    console.log('');

    // 14. 实例信息
    console.log('1️⃣4️⃣ 测试实例信息...');
    const instances = await testEndpoint('/instances');
    console.log(`   状态: ${instances.status}`);
    if (instances.data.instances) {
      console.log(`   总实例数: ${instances.data.instances.length}`);
      console.log(`   活跃实例: ${instances.data.instances.filter(i => i.isActive).length}`);
      console.log(`   空闲实例: ${instances.data.instances.filter(i => !i.isActive).length}\n`);
    }

    console.log('✅ 所有测试完成！');
    console.log('\n📊 测试总结:');
    console.log('   - 创建了 5 个点');
    console.log('   - 创建了 5 条线段/直线');
    console.log('   - 创建了 2 个多边形（三角形、矩形）');
    console.log('   - 创建了 3 个圆');
    console.log('   - 创建了 4 个函数曲线');
    console.log('   - 导出了 PNG、SVG、PDF 静态图片');
    console.log('   - 导出了 GIF、MP4 动画文件');
    console.log('\n📁 导出的文件可以在 exports/ 目录中找到');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 请确保 HTTP 服务正在运行:');
    console.log('   npm run dev:http');
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
  await runTests();
}

main().catch(console.error);

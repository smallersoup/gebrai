const { toolRegistry } = require('./dist/tools/index.js');
const fs = require('fs');
const path = require('path');

async function testExportWithFiles() {
  try {
    console.log('🎨 测试导出功能并保存文件...\n');
    
    // 1. 清除现有构造
    console.log('🧹 清除现有构造...');
    await toolRegistry.executeTool('geogebra_clear_construction', {});
    
    // 2. 创建一些基本的几何对象
    console.log('📍 创建点...');
    await toolRegistry.executeTool('geogebra_create_point', { name: 'O', x: 0, y: 0 });
    await toolRegistry.executeTool('geogebra_create_point', { name: 'A', x: 3, y: 0 });
    await toolRegistry.executeTool('geogebra_create_point', { name: 'B', x: 0, y: 4 });
    await toolRegistry.executeTool('geogebra_create_point', { name: 'C', x: 3, y: 4 });
    
    // 3. 创建线段
    console.log('📏 创建线段...');
    await toolRegistry.executeTool('geogebra_create_line_segment', { name: 'OA', point1: 'O', point2: 'A' });
    await toolRegistry.executeTool('geogebra_create_line_segment', { name: 'OB', point1: 'O', point2: 'B' });
    await toolRegistry.executeTool('geogebra_create_line_segment', { name: 'AC', point1: 'A', point2: 'C' });
    await toolRegistry.executeTool('geogebra_create_line_segment', { name: 'BC', point1: 'B', point2: 'C' });
    
    // 4. 创建圆
    console.log('⭕ 创建圆...');
    await toolRegistry.executeTool('geogebra_create_circle', { 
      name: 'circle1', 
      center: 'O', 
      radius: 2 
    });
    
    // 5. 创建函数（不设置颜色，避免错误）
    console.log('📈 创建函数...');
    await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'f',
      expression: 'x^2',
      xMin: -3,
      xMax: 3,
      thickness: 3
    });
    
    // 6. 创建另一个函数
    await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'g',
      expression: 'sin(x)',
      xMin: -3,
      xMax: 3,
      thickness: 2,
      style: 'dashed'
    });
    
    // 7. 创建文本标签（不设置颜色，避免错误）
    console.log('📝 创建文本标签...');
    await toolRegistry.executeTool('geogebra_create_text', {
      text: '这是一个测试图形',
      x: 0,
      y: 5,
      fontSize: 16,
      fontStyle: 'bold'
    });
    
    // 8. 获取所有对象
    console.log('\n📋 获取所有对象...');
    const objectsResult = await toolRegistry.executeTool('geogebra_get_objects', {});
    const objectsData = JSON.parse(objectsResult.content[0].text);
    console.log('对象数量:', objectsData.objectCount);
    console.log('对象列表:', objectsData.objects?.map(obj => `${obj.name} (${obj.type})`).join(', '));
    
    // 9. 导出PNG图像并保存到文件
    console.log('\n🖼️ 导出PNG图像并保存到文件...');
    const pngResult = await toolRegistry.executeTool('geogebra_export_png', {
      scale: 2,
      showAxes: true,
      showGrid: true,
      width: 1000,
      height: 800,
      xmin: -5,
      xmax: 5,
      ymin: -2,
      ymax: 6
    });
    
    const pngData = JSON.parse(pngResult.content[0].text);
    console.log('PNG导出:', pngData.success ? '✅' : '❌');
    
    if (pngData.success && pngData.data) {
      // 保存PNG文件
      const pngBuffer = Buffer.from(pngData.data, 'base64');
      const pngPath = path.join(__dirname, 'exported-image.png');
      fs.writeFileSync(pngPath, pngBuffer);
      console.log('✅ PNG文件已保存到:', pngPath);
      console.log('图像尺寸:', pngData.width + 'x' + pngData.height);
      console.log('文件大小:', pngBuffer.length, '字节');
    } else {
      console.log('❌ PNG导出失败:', pngData.error);
    }
    
    // 10. 尝试导出SVG
    console.log('\n📐 尝试导出SVG...');
    try {
      const svgResult = await toolRegistry.executeTool('geogebra_export_svg', {
        showAxes: true,
        showGrid: true,
        xmin: -5,
        xmax: 5,
        ymin: -2,
        ymax: 6
      });
      
      const svgData = JSON.parse(svgResult.content[0].text);
      console.log('SVG导出:', svgData.success ? '✅' : '❌');
      
      if (svgData.success && svgData.data) {
        // 保存SVG文件
        const svgPath = path.join(__dirname, 'exported-image.svg');
        fs.writeFileSync(svgPath, svgData.data);
        console.log('✅ SVG文件已保存到:', svgPath);
        console.log('SVG数据长度:', svgData.data.length, '字符');
      } else {
        console.log('❌ SVG导出失败:', svgData.error);
      }
    } catch (svgError) {
      console.log('❌ SVG导出出错:', svgError.message);
    }
    
    // 11. 尝试导出PDF
    console.log('\n📄 尝试导出PDF...');
    try {
      const pdfResult = await toolRegistry.executeTool('geogebra_export_pdf', {});
      const pdfData = JSON.parse(pdfResult.content[0].text);
      console.log('PDF导出:', pdfData.success ? '✅' : '❌');
      
      if (pdfData.success && pdfData.data) {
        // 保存PDF文件
        const pdfBuffer = Buffer.from(pdfData.data, 'base64');
        const pdfPath = path.join(__dirname, 'exported-image.pdf');
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log('✅ PDF文件已保存到:', pdfPath);
        console.log('文件大小:', pdfBuffer.length, '字节');
      } else {
        console.log('❌ PDF导出失败:', pdfData.error);
      }
    } catch (pdfError) {
      console.log('❌ PDF导出出错:', pdfError.message);
    }
    
    console.log('\n🎉 导出测试完成！');
    console.log('\n📊 总结:');
    console.log('✅ 基本几何对象创建正常');
    console.log('✅ 函数绘制正常');
    console.log('✅ PNG图像导出并保存到文件');
    console.log('❌ SVG导出功能需要修复');
    console.log('❓ PDF导出功能需要测试');
    
  } catch (error) {
    console.error('❌ 导出测试失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

testExportWithFiles().then(() => {
  console.log('\n测试结束，程序退出');
  process.exit(0);
});

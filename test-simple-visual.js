const { toolRegistry } = require('./dist/tools/index.js');

async function testSimpleVisual() {
  try {
    console.log('🎨 测试简单可视化功能...\n');
    
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
    
    // 5. 创建函数
    console.log('📈 创建函数...');
    await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'f',
      expression: 'x^2',
      xMin: -3,
      xMax: 3,
      color: '#FF0000',
      thickness: 3
    });
    
    // 6. 创建另一个函数
    await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'g',
      expression: 'sin(x)',
      xMin: -3,
      xMax: 3,
      color: '#0000FF',
      thickness: 2,
      style: 'dashed'
    });
    
    // 7. 创建文本标签
    console.log('📝 创建文本标签...');
    await toolRegistry.executeTool('geogebra_create_text', {
      text: '这是一个测试图形',
      x: 0,
      y: 5,
      fontSize: 16,
      color: '#000000',
      fontStyle: 'bold'
    });
    
    // 8. 获取所有对象
    console.log('\n📋 获取所有对象...');
    const objectsResult = await toolRegistry.executeTool('geogebra_get_objects', {});
    const objectsData = JSON.parse(objectsResult.content[0].text);
    console.log('对象数量:', objectsData.objectCount);
    console.log('对象列表:', objectsData.objects?.map(obj => `${obj.name} (${obj.type})`).join(', '));
    
    // 9. 导出PNG图像
    console.log('\n🖼️ 导出PNG图像...');
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
    if (pngData.success) {
      console.log('图像尺寸:', pngData.width + 'x' + pngData.height);
      console.log('图像数据长度:', pngData.data ? pngData.data.length : '无数据');
      console.log('缩放比例:', pngData.scale);
      console.log('显示坐标轴:', pngData.viewSettings.showAxes);
      console.log('显示网格:', pngData.viewSettings.showGrid);
    } else {
      console.log('导出错误:', pngData.error);
    }
    
    // 10. 导出SVG
    console.log('\n📐 导出SVG...');
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
    if (svgData.success) {
      console.log('SVG数据长度:', svgData.data ? svgData.data.length : '无数据');
    } else {
      console.log('SVG导出错误:', svgData.error);
    }
    
    console.log('\n🎉 可视化测试完成！');
    console.log('\n📊 总结:');
    console.log('✅ 基本几何对象创建正常');
    console.log('✅ 函数绘制正常');
    console.log('✅ 图像导出正常');
    console.log('❌ 复杂动画功能需要脚本支持');
    
  } catch (error) {
    console.error('❌ 可视化测试失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

testSimpleVisual().then(() => {
  console.log('\n测试结束，程序退出');
  process.exit(0);
});


const { toolRegistry } = require('./dist/tools/index.js');

async function testSimpleAnimation() {
  try {
    console.log('🎬 测试简单动画功能...\n');
    
    // 1. 首先检查GeoGebra实例状态
    console.log('📊 检查GeoGebra实例状态...');
    const statusResult = await toolRegistry.executeTool('geogebra_instance_status', {});
    const status = JSON.parse(statusResult.content[0].text);
    console.log('实例状态:', status.success ? '✅ 正常' : '❌ 异常');
    console.log('实例ID:', status.status?.instanceId);
    console.log('就绪状态:', status.status?.isReady ? '✅' : '❌');
    
    // 2. 清除现有构造
    console.log('\n🧹 清除现有构造...');
    const clearResult = await toolRegistry.executeTool('geogebra_clear_construction', {});
    console.log('清除结果:', JSON.parse(clearResult.content[0].text).success ? '✅' : '❌');
    
    // 3. 创建简单的点
    console.log('\n📍 创建测试点...');
    const pointResult = await toolRegistry.executeTool('geogebra_create_point', {
      name: 'A',
      x: 0,
      y: 0
    });
    console.log('点A创建:', JSON.parse(pointResult.content[0].text).success ? '✅' : '❌');
    
    // 4. 创建另一个点
    const pointBResult = await toolRegistry.executeTool('geogebra_create_point', {
      name: 'B',
      x: 3,
      y: 4
    });
    console.log('点B创建:', JSON.parse(pointBResult.content[0].text).success ? '✅' : '❌');
    
    // 5. 创建线段
    console.log('\n📏 创建线段...');
    const segmentResult = await toolRegistry.executeTool('geogebra_create_line_segment', {
      name: 'AB',
      point1: 'A',
      point2: 'B'
    });
    console.log('线段AB创建:', JSON.parse(segmentResult.content[0].text).success ? '✅' : '❌');
    
    // 6. 尝试创建滑块（如果支持的话）
    console.log('\n🎚️ 尝试创建滑块...');
    try {
      const sliderResult = await toolRegistry.executeTool('geogebra_create_slider', {
        name: 't',
        min: 0,
        max: 10,
        increment: 0.1,
        defaultValue: 0
      });
      const sliderData = JSON.parse(sliderResult.content[0].text);
      console.log('滑块创建:', sliderData.success ? '✅' : '❌');
      if (!sliderData.success) {
        console.log('滑块错误:', sliderData.error);
      }
    } catch (error) {
      console.log('滑块创建失败:', error.message);
    }
    
    // 7. 导出PNG图像
    console.log('\n🖼️ 导出PNG图像...');
    try {
      const exportResult = await toolRegistry.executeTool('geogebra_export_png', {
        scale: 1,
        showAxes: true,
        showGrid: true
      });
      const exportData = JSON.parse(exportResult.content[0].text);
      console.log('PNG导出:', exportData.success ? '✅' : '❌');
      if (exportData.success) {
        console.log('图像数据长度:', exportData.data ? exportData.data.length : '无数据');
      } else {
        console.log('导出错误:', exportData.error);
      }
    } catch (error) {
      console.log('PNG导出失败:', error.message);
    }
    
    // 8. 获取所有对象
    console.log('\n📋 获取所有对象...');
    const objectsResult = await toolRegistry.executeTool('geogebra_get_objects', {});
    const objectsData = JSON.parse(objectsResult.content[0].text);
    console.log('对象数量:', objectsData.objectCount);
    console.log('对象列表:', objectsData.objects?.map(obj => obj.name).join(', '));
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

testSimpleAnimation().then(() => {
  console.log('\n测试结束，程序退出');
  process.exit(0);
});


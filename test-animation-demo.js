require('dotenv/config');
const { toolRegistry } = require('./dist/tools/index.js');

async function testAnimationDemo() {
  try {
    console.log('🎬 测试动画演示功能...\n');
    
    // 1. 清除现有构造
    console.log('🧹 清除现有构造...');
    await toolRegistry.executeTool('geogebra_clear_construction', {});
    
    // 2. 创建动画演示
    console.log('🌀 创建参数螺旋动画演示...');
    const demoResult = await toolRegistry.executeTool('geogebra_animation_demo', {
      demoType: 'parametric_spiral',
      animationSpeed: 1.0
    });
    
    const demoData = JSON.parse(demoResult.content[0].text);
    console.log('演示创建:', demoData.success ? '✅' : '❌');
    
    if (demoData.success) {
      console.log('创建的对象:', demoData.demo.createdObjects.join(', '));
      console.log('动画对象:', demoData.demo.animatedObjects.join(', '));
      
      // 3. 检查动画状态
      console.log('\n📊 检查动画状态...');
      const statusResult = await toolRegistry.executeTool('geogebra_animation_status', {});
      const statusData = JSON.parse(statusResult.content[0].text);
      console.log('动画运行状态:', statusData.isRunning ? '▶️ 运行中' : '⏸️ 已停止');
      
      // 4. 启动动画
      console.log('\n▶️ 启动动画...');
      const startResult = await toolRegistry.executeTool('geogebra_start_animation', {});
      const startData = JSON.parse(startResult.content[0].text);
      console.log('动画启动:', startData.success ? '✅' : '❌');
      
      // 5. 再次检查状态
      console.log('\n📊 再次检查动画状态...');
      const statusResult2 = await toolRegistry.executeTool('geogebra_animation_status', {});
      const statusData2 = JSON.parse(statusResult2.content[0].text);
      console.log('动画运行状态:', statusData2.isRunning ? '▶️ 运行中' : '⏸️ 已停止');
      
      // 6. 等待几秒钟让动画运行
      console.log('\n⏳ 让动画运行3秒钟...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 7. 停止动画
      console.log('\n⏹️ 停止动画...');
      const stopResult = await toolRegistry.executeTool('geogebra_stop_animation', {});
      const stopData = JSON.parse(stopResult.content[0].text);
      console.log('动画停止:', stopData.success ? '✅' : '❌');
      
      // 8. 导出动画帧
      console.log('\n🎞️ 导出动画帧...');
      try {
        const exportResult = await toolRegistry.executeTool('geogebra_export_animation', {
          frameCount: 10,
          frameDelay: 200,
          scale: 1
        });
        const exportData = JSON.parse(exportResult.content[0].text);
        console.log('动画导出:', exportData.success ? '✅' : '❌');
        if (exportData.success) {
          console.log('导出帧数:', exportData.export.frameCount);
          console.log('帧延迟:', exportData.export.frameDelay + 'ms');
          console.log('总时长:', exportData.export.totalDuration + 's');
        } else {
          console.log('导出错误:', exportData.error);
        }
      } catch (error) {
        console.log('动画导出失败:', error.message);
      }
      
      // 9. 导出最终图像
      console.log('\n🖼️ 导出最终PNG图像...');
      const pngResult = await toolRegistry.executeTool('geogebra_export_png', {
        scale: 1,
        showAxes: true,
        showGrid: true,
        width: 800,
        height: 600
      });
      const pngData = JSON.parse(pngResult.content[0].text);
      console.log('PNG导出:', pngData.success ? '✅' : '❌');
      if (pngData.success) {
        console.log('图像数据长度:', pngData.data ? pngData.data.length : '无数据');
        console.log('图像尺寸:', pngData.width + 'x' + pngData.height);
      }
      
    } else {
      console.log('演示创建失败:', demoData.error);
    }
    
    console.log('\n🎉 动画测试完成！');
    
  } catch (error) {
    console.error('❌ 动画测试失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

testAnimationDemo().then(() => {
  console.log('\n测试结束，程序退出');
  process.exit(0);
});


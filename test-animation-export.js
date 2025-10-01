require('dotenv/config');
const { toolRegistry } = require('./dist/tools/index.js');
const fs = require('fs');
const path = require('path');

async function testAnimationExport() {
  try {
    console.log('🎬 测试动画导出功能...\n');
    
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
      
      // 3. 启动动画
      console.log('\n▶️ 启动动画...');
      const startResult = await toolRegistry.executeTool('geogebra_start_animation', {});
      const startData = JSON.parse(startResult.content[0].text);
      console.log('动画启动:', startData.success ? '✅' : '❌');
      
      // 4. 等待几秒钟让动画运行
      console.log('\n⏳ 让动画运行2秒钟...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. 停止动画
      console.log('\n⏹️ 停止动画...');
      const stopResult = await toolRegistry.executeTool('geogebra_stop_animation', {});
      const stopData = JSON.parse(stopResult.content[0].text);
      console.log('动画停止:', stopData.success ? '✅' : '❌');
      
      // 6. 导出动画帧
      console.log('\n🎞️ 导出动画帧...');
      try {
        const exportResult = await toolRegistry.executeTool('geogebra_export_animation', {
          frameCount: 5,
          frameDelay: 200,
          scale: 1,
          width: 800,
          height: 600
        });
        const exportData = JSON.parse(exportResult.content[0].text);
        console.log('动画导出:', exportData.success ? '✅' : '❌');
        
        if (exportData.success && exportData.export && exportData.export.frames) {
          console.log('导出帧数:', exportData.export.frameCount);
          console.log('帧延迟:', exportData.export.frameDelay + 'ms');
          console.log('总时长:', exportData.export.totalDuration + 's');
          
          // 保存每一帧到文件
          const framesDir = path.join(__dirname, 'animation-frames');
          if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
          }
          
          exportData.export.frames.forEach((frameData, index) => {
            const frameBuffer = Buffer.from(frameData, 'base64');
            const framePath = path.join(framesDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
            fs.writeFileSync(framePath, frameBuffer);
            console.log(`✅ 帧 ${index + 1} 已保存到: ${framePath}`);
          });
          
          console.log(`\n🎉 动画帧导出完成！共 ${exportData.export.frames.length} 帧`);
          console.log(`📁 帧文件保存在: ${framesDir}`);
          
        } else {
          console.log('❌ 动画导出失败:', exportData.error);
        }
      } catch (error) {
        console.log('❌ 动画导出出错:', error.message);
      }
      
      // 7. 导出最终图像
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
      
      if (pngData.success && pngData.data) {
        const pngBuffer = Buffer.from(pngData.data, 'base64');
        const pngPath = path.join(__dirname, 'animation-final.png');
        fs.writeFileSync(pngPath, pngBuffer);
        console.log('✅ 最终图像已保存到:', pngPath);
        console.log('图像尺寸:', pngData.width + 'x' + pngData.height);
        console.log('文件大小:', pngBuffer.length, '字节');
      }
      
    } else {
      console.log('❌ 演示创建失败:', demoData.error);
    }
    
    console.log('\n🎉 动画导出测试完成！');
    
  } catch (error) {
    console.error('❌ 动画导出测试失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

testAnimationExport().then(() => {
  console.log('\n测试结束，程序退出');
  process.exit(0);
});

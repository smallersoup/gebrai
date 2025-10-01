require('dotenv/config');
const { toolRegistry } = require('./dist/tools/index.js');
const fs = require('fs');
const path = require('path');

async function debugAnimation() {
  try {
    console.log('🔍 调试动画问题...\n');
    
    // 1. 清除现有构造
    console.log('🧹 清除现有构造...');
    await toolRegistry.executeTool('geogebra_clear_construction', {});
    
    // 2. 创建滑块并检查其属性
    console.log('🎚️ 创建滑块...');
    const sliderResult = await toolRegistry.executeTool('geogebra_create_slider', {
      name: 't',
      min: 0,
      max: 2 * Math.PI,
      increment: 0.1,
      defaultValue: 0
    });
    console.log('滑块创建结果:', JSON.parse(sliderResult.content[0].text));
    
    // 3. 创建参数化对象
    console.log('📍 创建参数化对象...');
    await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'P = (t, sin(t))'
    });
    
    // 4. 检查滑块是否可以被动画化
    console.log('🔍 检查滑块动画属性...');
    try {
      const animateResult = await toolRegistry.executeTool('geogebra_animate_parameter', {
        objectName: 't',
        animate: true,
        speed: 1
      });
      console.log('滑块动画设置:', JSON.parse(animateResult.content[0].text));
    } catch (error) {
      console.log('❌ 滑块动画设置失败:', error.message);
    }
    
    // 5. 手动设置滑块值来测试变化
    console.log('🎯 手动测试滑块值变化...');
    for (let i = 0; i < 5; i++) {
      const value = (i * Math.PI) / 2;
      console.log(`设置滑块值为: ${value}`);
      
      await toolRegistry.executeTool('geogebra_eval_command', {
        command: `SetValue(t, ${value})`
      });
      
      // 等待一下让值更新
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 导出当前状态
      const pngResult = await toolRegistry.executeTool('geogebra_export_png', {
        scale: 1,
        showAxes: true,
        showGrid: false,
        width: 400,
        height: 300
      });
      
      const pngData = JSON.parse(pngResult.content[0].text);
      if (pngData.success && pngData.data) {
        const frameBuffer = Buffer.from(pngData.data, 'base64');
        const framePath = path.join(__dirname, `debug-frame-${i + 1}.png`);
        fs.writeFileSync(framePath, frameBuffer);
        console.log(`✅ 帧 ${i + 1} 已保存 (${frameBuffer.length} 字节)`);
      }
    }
    
    // 6. 检查文件大小差异
    console.log('\n📊 检查手动设置的文件大小差异...');
    const debugFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('debug-frame-')).sort();
    const fileSizes = debugFiles.map(f => fs.statSync(path.join(__dirname, f)).size);
    const uniqueSizes = [...new Set(fileSizes)];
    
    console.log(`手动测试帧数: ${debugFiles.length}`);
    console.log(`文件大小: ${fileSizes.join(', ')}`);
    console.log(`唯一大小数: ${uniqueSizes.length}`);
    
    if (uniqueSizes.length > 1) {
      console.log('✅ 手动设置滑块值有变化 - 对象创建正常');
    } else {
      console.log('❌ 手动设置滑块值没有变化 - 对象创建有问题');
    }
    
    // 7. 现在测试真正的动画
    console.log('\n🎬 测试真正的动画...');
    
    // 启用滑块动画
    try {
      await toolRegistry.executeTool('geogebra_animate_parameter', {
        objectName: 't',
        animate: true,
        speed: 1
      });
    } catch (error) {
      console.log('❌ 无法启用滑块动画:', error.message);
    }
    
    // 启动动画
    console.log('▶️ 启动动画...');
    const startResult = await toolRegistry.executeTool('geogebra_start_animation', {});
    const startData = JSON.parse(startResult.content[0].text);
    console.log('动画启动:', startData.success ? '✅' : '❌');
    
    // 检查动画状态
    const statusResult = await toolRegistry.executeTool('geogebra_animation_status', {});
    const statusData = JSON.parse(statusResult.content[0].text);
    console.log('动画状态:', statusData.isRunning ? '▶️ 运行中' : '⏸️ 已停止');
    
    // 等待动画运行
    console.log('⏳ 让动画运行2秒钟...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 停止动画
    console.log('⏹️ 停止动画...');
    const stopResult = await toolRegistry.executeTool('geogebra_stop_animation', {});
    const stopData = JSON.parse(stopResult.content[0].text);
    console.log('动画停止:', stopData.success ? '✅' : '❌');
    
    // 8. 导出动画帧
    console.log('\n🎞️ 导出动画帧...');
    try {
      const exportResult = await toolRegistry.executeTool('geogebra_export_animation', {
        frameCount: 5,
        frameDelay: 400,
        scale: 1,
        width: 400,
        height: 300
      });
      const exportData = JSON.parse(exportResult.content[0].text);
      console.log('动画导出:', exportData.success ? '✅' : '❌');
      
      if (exportData.success && exportData.export && exportData.export.frames) {
        // 保存动画帧
        const framesDir = path.join(__dirname, 'debug-animation-frames');
        if (!fs.existsSync(framesDir)) {
          fs.mkdirSync(framesDir);
        }
        
        exportData.export.frames.forEach((frameData, index) => {
          const frameBuffer = Buffer.from(frameData, 'base64');
          const framePath = path.join(framesDir, `anim-frame-${String(index + 1).padStart(3, '0')}.png`);
          fs.writeFileSync(framePath, frameBuffer);
          console.log(`✅ 动画帧 ${index + 1} 已保存 (${frameBuffer.length} 字节)`);
        });
        
        // 检查动画帧文件大小差异
        const animFiles = fs.readdirSync(framesDir).filter(f => f.startsWith('anim-frame-')).sort();
        const animFileSizes = animFiles.map(f => fs.statSync(path.join(framesDir, f)).size);
        const animUniqueSizes = [...new Set(animFileSizes)];
        
        console.log(`\n📊 动画帧分析:`);
        console.log(`动画帧数: ${animFiles.length}`);
        console.log(`文件大小: ${animFileSizes.join(', ')}`);
        console.log(`唯一大小数: ${animUniqueSizes.length}`);
        
        if (animUniqueSizes.length > 1) {
          console.log('✅ 动画帧有变化 - 动画正常工作！');
        } else {
          console.log('❌ 动画帧没有变化 - 动画没有真正运行');
        }
      }
    } catch (exportError) {
      console.log('❌ 动画导出出错:', exportError.message);
    }
    
    console.log('\n🎉 动画调试完成！');
    
  } catch (error) {
    console.error('❌ 动画调试失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

debugAnimation().then(() => {
  console.log('\n调试结束，程序退出');
  process.exit(0);
});

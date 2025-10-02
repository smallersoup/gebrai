#!/usr/bin/env node

/**
 * 测试文件导出功能
 * 演示如何使用新的PNG、GIF和MP4文件导出工具
 */

const { toolRegistry } = require('./dist/tools');

async function testFileExports() {
  console.log('🎬 测试文件导出功能...\n');
  
  const registry = toolRegistry;

  try {
    // ==================== Step 1: 创建正弦曲线和动画 ====================
    console.log('📊 Step 1: 创建正弦曲线和动画...');
    
    // 创建滑块
    await registry.executeTool('geogebra_create_slider', {
      name: 'slider',
      min: 0,
      max: 6.28,
      increment: 0.05,
      defaultValue: 0,
      width: 200
    });
    console.log('✅ 滑块创建完成');

    // 绘制正弦函数
    await registry.executeTool('geogebra_eval_command', {
      command: 'f(x) = sin(x)'
    });
    console.log('✅ 正弦函数创建完成');

    // 创建动态点
    await registry.executeTool('geogebra_eval_command', {
      command: 'P = (slider, sin(slider))'
    });
    console.log('✅ 动态点创建完成');

    // 配置动画
    await registry.executeTool('geogebra_animate_parameter', {
      objectName: 'slider',
      animate: true,
      speed: 1.5,
      direction: 'forward'
    });
    console.log('✅ 动画配置完成');

    // 启用轨迹
    await registry.executeTool('geogebra_trace_object', {
      objectName: 'P',
      enableTrace: true
    });
    console.log('✅ 轨迹启用完成\n');

    // ==================== Step 2: 导出PNG文件 ====================
    console.log('📸 Step 2: 导出PNG文件...');
    
    const pngResult = await registry.executeTool('geogebra_export_png_file', {
      filename: 'sine_wave_snapshot_slider',
      width: 1200,
      height: 800,
      showGrid: false,
      showAxes: true
    });
    
    const pngData = JSON.parse(pngResult.content[0].text);
    console.log('✅ PNG文件导出成功:');
    console.log(`   文件: ${pngData.filename}`);
    console.log(`   路径: ${pngData.filePath}`);
    console.log(`   大小: ${(pngData.fileSize / 1024).toFixed(2)} KB\n`);

    // ==================== Step 3: 启动动画 ====================
    console.log('▶️  Step 3: 启动动画...');
    
    await registry.executeTool('geogebra_start_animation', {});
    console.log('✅ 动画已启动\n');

    // 等待一下让动画运行
    console.log('⏳ 等待动画运行...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ==================== Step 4: 导出GIF动画 ====================
    console.log('\n🎞️  Step 4: 导出GIF动画...');
    
    const gifResult = await registry.executeTool('geogebra_export_gif_file', {
      filename: 'sine_wave_animation_slider',
      duration: 3000,
      frameRate: 15,
      quality: 90,
      width: 800,
      height: 600
    });
    
    const gifData = JSON.parse(gifResult.content[0].text);
    console.log('✅ GIF文件导出成功:');
    console.log(`   文件: ${gifData.filename}`);
    console.log(`   路径: ${gifData.filePath}`);
    console.log(`   大小: ${(gifData.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   帧数: ${gifData.metadata.frameCount} 帧\n`);

    // ==================== Step 5: 导出MP4视频 ====================
    console.log('🎥 Step 5: 导出MP4视频...');
    
    const mp4Result = await registry.executeTool('geogebra_export_mp4_file', {
      filename: 'sine_wave_video_slider',
      duration: 5000,
      frameRate: 30,
      quality: 23,
      width: 1920,
      height: 1080
    });
    
    const mp4Data = JSON.parse(mp4Result.content[0].text);
    console.log('✅ MP4文件导出成功:');
    console.log(`   文件: ${mp4Data.filename}`);
    console.log(`   路径: ${mp4Data.filePath}`);
    console.log(`   大小: ${(mp4Data.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   帧数: ${mp4Data.metadata.frameCount} 帧`);
    console.log(`   编码: ${mp4Data.metadata.codec}\n`);

    // ==================== Step 6: 停止动画 ====================
    console.log('⏹️  Step 6: 停止动画...');
    
    await registry.executeTool('geogebra_stop_animation', {});
    console.log('✅ 动画已停止\n');

    console.log('🎉 所有测试完成！\n');
    console.log('📋 导出文件总结:');
    console.log('  ✅ PNG静态图像: sine_wave_snapshot_slider.png');
    console.log('  ✅ GIF动画: sine_wave_animation_slider.gif');
    console.log('  ✅ MP4视频: sine_wave_video_slider.mp4');
    console.log('\n💡 这些文件默认保存在 ./exports 目录中');
    console.log('🏁 文件导出功能测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n📝 请检查错误信息并重试');
  }
}

// 运行测试
if (require.main === module) {
  testFileExports().catch(console.error);
}

module.exports = { testFileExports };


#!/usr/bin/env node

/**
 * 测试不同滑块名称的动画导出效果
 * 验证修复后的智能滑块检测功能
 */

const { toolRegistry } = require('./dist/tools');

async function testSliderName(sliderName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 测试滑块名称: "${sliderName}"`);
  console.log('='.repeat(60));
  
  const registry = toolRegistry;

  try {
    // 清空构造（如果有多个测试）
    await registry.executeTool('geogebra_clear_construction', {});
    console.log('✅ 构造已清空');

    // 创建滑块（使用指定名称）
    await registry.executeTool('geogebra_create_slider', {
      name: sliderName,
      min: 0,
      max: 6.28,
      increment: 0.05,
      defaultValue: 0,
      width: 200
    });
    console.log(`✅ 滑块 "${sliderName}" 创建完成`);

    // 绘制正弦函数（使用滑块变量）
    await registry.executeTool('geogebra_eval_command', {
      command: 'f(x) = sin(x)'
    });
    console.log('✅ 正弦函数创建完成');

    // 创建动态点（使用滑块变量）
    await registry.executeTool('geogebra_eval_command', {
      command: `P = (${sliderName}, sin(${sliderName}))`
    });
    console.log('✅ 动态点创建完成');

    // 配置动画
    await registry.executeTool('geogebra_animate_parameter', {
      objectName: sliderName,
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
    console.log('✅ 轨迹启用完成');

    // 启动动画
    await registry.executeTool('geogebra_start_animation', {});
    console.log('▶️  动画已启动');

    // 等待动画运行
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 导出 GIF
    console.log('\n🎞️  导出 GIF 动画...');
    const gifResult = await registry.executeTool('geogebra_export_gif_file', {
      filename: `test_slider_${sliderName}`,
      duration: 2000,
      frameRate: 10,
      quality: 90,
      width: 600,
      height: 400
    });
    
    const gifData = JSON.parse(gifResult.content[0].text);
    console.log('✅ GIF 文件导出成功:');
    console.log(`   文件: ${gifData.filename}`);
    console.log(`   路径: ${gifData.filePath}`);
    console.log(`   大小: ${(gifData.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   帧数: ${gifData.metadata.frameCount} 帧`);

    // 停止动画
    await registry.executeTool('geogebra_stop_animation', {});
    console.log('⏹️  动画已停止');

    console.log(`\n✅ 滑块 "${sliderName}" 测试成功！`);
    return true;

  } catch (error) {
    console.error(`\n❌ 滑块 "${sliderName}" 测试失败:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🎬 开始测试不同滑块名称...\n');
  
  const sliderNames = ['slider', 't', 'a', 'myParam', 'angle'];
  const results = {};
  
  for (const name of sliderNames) {
    results[name] = await testSliderName(name);
    
    // 短暂等待，让系统清理资源
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 显示测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  for (const [name, success] of Object.entries(results)) {
    console.log(`  ${success ? '✅' : '❌'} 滑块 "${name}": ${success ? '成功' : '失败'}`);
  }

  const successCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n📈 成功率: ${successCount}/${totalCount} (${(successCount/totalCount*100).toFixed(0)}%)`);
  console.log('\n💡 改进说明：');
  console.log('   系统现在会自动检测实际存在的滑块对象，');
  console.log('   而不是盲目尝试常见名称，提高了动画导出的可靠性。');
  console.log('\n🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testSliderName, runAllTests };


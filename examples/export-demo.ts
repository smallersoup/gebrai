#!/usr/bin/env node

/**
 * GeoGebra Export Demo - GEB-4 Implementation
 * 
 * This demo showcases the enhanced export functionality implemented for Linear Issue GEB-4.
 * It demonstrates:
 * - PNG export with configurable dimensions, quality, and transparency
 * - SVG export with view configuration
 * - View settings (zoom, center, axes visibility)
 * - Multiple export formats with different parameters
 */

import { toolRegistry } from '../src/tools';

async function demonstrateExportFeatures() {
  console.log('🎨 GeoGebra Enhanced Export Demo (GEB-4)\n');

  try {
    // First, create some mathematical objects
    console.log('📐 Creating mathematical construction...');
    
    await toolRegistry.executeTool('geogebra_create_point', {
      name: 'A',
      x: -2,
      y: 1
    });

    await toolRegistry.executeTool('geogebra_create_point', {
      name: 'B',
      x: 3,
      y: 2
    });

    await toolRegistry.executeTool('geogebra_create_line', {
      name: 'line1',
      point1: 'A',
      point2: 'B'
    });

    await toolRegistry.executeTool('geogebra_create_circle', {
      name: 'circle1',
      center: 'A',
      radius: 2
    });

    console.log('✅ Mathematical construction created\n');

    // Demo 1: Basic PNG export with enhanced parameters
    console.log('🖼️  Demo 1: Enhanced PNG Export');
    const pngResult = await toolRegistry.executeTool('geogebra_export_png', {
      scale: 2,
      transparent: true,
      dpi: 150,
      showAxes: true,
      showGrid: false
    });

    const pngResponse = JSON.parse(pngResult.content[0]?.text!);
    console.log(`   ✓ PNG exported with scale: ${pngResponse.scale}, DPI: ${pngResponse.dpi}, transparent: ${pngResponse.transparent}`);
    console.log(`   ✓ Data size: ${pngResponse.data.length} characters (base64)\n`);

    // Demo 2: PNG export with specific dimensions
    console.log('📏 Demo 2: PNG Export with Custom Dimensions');
    const pngDimensionsResult = await toolRegistry.executeTool('geogebra_export_png', {
      width: 1200,
      height: 800,
      transparent: false,
      dpi: 300
    });

    const pngDimensionsResponse = JSON.parse(pngDimensionsResult.content[0]?.text!);
    console.log(`   ✓ PNG exported with dimensions: ${pngDimensionsResponse.width}x${pngDimensionsResponse.height}`);
    console.log(`   ✓ High quality: ${pngDimensionsResponse.dpi} DPI\n`);

    // Demo 3: PNG export with custom view settings
    console.log('🔍 Demo 3: PNG Export with Custom View');
    const pngViewResult = await toolRegistry.executeTool('geogebra_export_png', {
      xmin: -5,
      xmax: 5,
      ymin: -3,
      ymax: 3,
      showAxes: false,
      showGrid: true,
      scale: 1.5
    });

    const pngViewResponse = JSON.parse(pngViewResult.content[0]?.text!);
    console.log(`   ✓ PNG exported with custom coordinate system: x[${pngViewResponse.viewSettings.coordSystem.xmin}, ${pngViewResponse.viewSettings.coordSystem.xmax}], y[${pngViewResponse.viewSettings.coordSystem.ymin}, ${pngViewResponse.viewSettings.coordSystem.ymax}]`);
    console.log(`   ✓ Axes visible: ${pngViewResponse.viewSettings.showAxes}, Grid visible: ${pngViewResponse.viewSettings.showGrid}\n`);

    // Demo 4: SVG export with view configuration
    console.log('🎯 Demo 4: Enhanced SVG Export');
    const svgResult = await toolRegistry.executeTool('geogebra_export_svg', {
      xmin: -4,
      xmax: 4,
      ymin: -2,
      ymax: 4,
      showAxes: true,
      showGrid: false
    });

    const svgResponse = JSON.parse(svgResult.content[0]?.text!);
    console.log(`   ✓ SVG exported with coordinate system: x[${svgResponse.viewSettings.coordSystem.xmin}, ${svgResponse.viewSettings.coordSystem.xmax}], y[${svgResponse.viewSettings.coordSystem.ymin}, ${svgResponse.viewSettings.coordSystem.ymax}]`);
    console.log(`   ✓ SVG data size: ${svgResponse.data.length} characters\n`);

    // Demo 5: PDF export (existing functionality)
    console.log('📄 Demo 5: PDF Export');
    const pdfResult = await toolRegistry.executeTool('geogebra_export_pdf', {});
    const pdfResponse = JSON.parse(pdfResult.content[0]?.text!);
    console.log(`   ✓ PDF exported, data size: ${pdfResponse.data.length} characters (base64)\n`);

    // Demo 6: Multiple exports with different settings
    console.log('🔄 Demo 6: Multiple Export Formats');
    
    const exports = [
      {
        name: 'Thumbnail PNG',
        tool: 'geogebra_export_png',
        params: { width: 400, height: 300, transparent: true }
      },
      {
        name: 'High-res PNG',
        tool: 'geogebra_export_png',
        params: { scale: 3, dpi: 300, transparent: false }
      },
      {
        name: 'Vector SVG',
        tool: 'geogebra_export_svg',
        params: { showAxes: false, showGrid: true }
      }
    ];

    for (const exportConfig of exports) {
      const result = await toolRegistry.executeTool(exportConfig.tool, exportConfig.params);
      const response = JSON.parse(result.content[0]?.text!);
      console.log(`   ✓ ${exportConfig.name}: ${response.format} format, ${response.data.length} chars`);
    }

    console.log('\n🎉 All export demos completed successfully!');
    console.log('\n📋 GEB-4 Implementation Summary:');
    console.log('   ✅ PNG export with configurable dimensions (width, height)');
    console.log('   ✅ PNG export with quality settings (DPI, transparency)');
    console.log('   ✅ View configuration (coordinate system, axes, grid)');
    console.log('   ✅ SVG export with view settings');
    console.log('   ✅ Base64 encoding for image data transfer');
    console.log('   ✅ Integration with MCP server');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateExportFeatures().catch(console.error);
}

export { demonstrateExportFeatures }; 
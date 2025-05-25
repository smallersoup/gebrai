#!/usr/bin/env node

/**
 * GeoGebra Function Plotting Demo - GEB-5 Implementation
 * 
 * This demo showcases the function plotting functionality implemented for Linear Issue GEB-5.
 * It demonstrates:
 * - Standard function plotting f(x) = expression
 * - Parametric curve plotting with x(t) and y(t)
 * - Implicit curve plotting with F(x,y) = 0
 * - Domain and range configuration
 * - Function styling (color, thickness, line style)
 * - Integration with export functionality
 */

import { toolRegistry } from '../src/tools';

async function demonstrateFunctionPlotting() {
  console.log('📈 GeoGebra Function Plotting Demo (GEB-5)\n');

  try {
    // Clear any existing construction
    console.log('🧹 Clearing construction...');
    await toolRegistry.executeTool('geogebra_clear_construction', {});
    console.log('✅ Construction cleared\n');

    // Demo 1: Standard Function Plotting
    console.log('📊 Demo 1: Standard Function Plotting');
    
    // Plot a quadratic function
    const quadratic = await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'quadratic',
      expression: 'x^2',
      color: '#FF0000',
      thickness: 2,
      style: 'solid'
    });
    
    const quadResponse = JSON.parse(quadratic.content[0]?.text!);
    console.log(`   ✓ Quadratic function: ${quadResponse.command}`);

    // Plot a trigonometric function with domain restriction
    const sine = await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'sine',
      expression: 'sin(x)',
      xMin: 0,
      xMax: 6.28,
      color: '#0000FF',
      thickness: 3,
      style: 'dashed'
    });
    
    const sineResponse = JSON.parse(sine.content[0]?.text!);
    console.log(`   ✓ Sine function with domain: ${sineResponse.command}`);
    console.log(`   ✓ Domain: [${sineResponse.domain.xMin}, ${sineResponse.domain.xMax}]`);

    // Plot an exponential function
    const exponential = await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'exp',
      expression: 'e^x',
      color: '#00AA00',
      thickness: 2
    });
    
    const expResponse = JSON.parse(exponential.content[0]?.text!);
    console.log(`   ✓ Exponential function: ${expResponse.command}\n`);

    // Demo 2: Parametric Curves
    console.log('🌀 Demo 2: Parametric Curve Plotting');
    
    // Plot a circle
    const circle = await toolRegistry.executeTool('geogebra_plot_parametric', {
      name: 'circle',
      xExpression: '2*cos(t)',
      yExpression: '2*sin(t)',
      parameter: 't',
      tMin: 0,
      tMax: 6.28,
      color: '#FF00FF',
      thickness: 2,
      style: 'solid'
    });
    
    const circleResponse = JSON.parse(circle.content[0]?.text!);
    console.log(`   ✓ Circle: ${circleResponse.command}`);
    console.log(`   ✓ Parameter range: ${circleResponse.parametric.parameter} ∈ [${circleResponse.parametric.range.tMin}, ${circleResponse.parametric.range.tMax}]`);

    // Plot a spiral
    const spiral = await toolRegistry.executeTool('geogebra_plot_parametric', {
      name: 'spiral',
      xExpression: 's*cos(s)',
      yExpression: 's*sin(s)',
      parameter: 's',
      tMin: 0,
      tMax: 10,
      color: '#00FFFF',
      thickness: 1,
      style: 'dotted'
    });
    
    const spiralResponse = JSON.parse(spiral.content[0]?.text!);
    console.log(`   ✓ Spiral: ${spiralResponse.command}`);

    // Plot a Lissajous curve
    const lissajous = await toolRegistry.executeTool('geogebra_plot_parametric', {
      name: 'lissajous',
      xExpression: 'sin(3*u)',
      yExpression: 'sin(2*u)',
      parameter: 'u',
      tMin: 0,
      tMax: 6.28,
      color: '#FFAA00',
      thickness: 2
    });
    
    const lissajousResponse = JSON.parse(lissajous.content[0]?.text!);
    console.log(`   ✓ Lissajous curve: ${lissajousResponse.command}\n`);

    // Demo 3: Implicit Curves
    console.log('🔄 Demo 3: Implicit Curve Plotting');
    
    // Plot an ellipse
    const ellipse = await toolRegistry.executeTool('geogebra_plot_implicit', {
      name: 'ellipse',
      expression: 'x^2/4 + y^2/9 - 1',
      color: '#8000FF',
      thickness: 3,
      style: 'solid'
    });
    
    const ellipseResponse = JSON.parse(ellipse.content[0]?.text!);
    console.log(`   ✓ Ellipse: ${ellipseResponse.command}`);
    console.log(`   ✓ Implicit equation: ${ellipseResponse.implicit.expression} = 0`);

    // Plot a hyperbola
    const hyperbola = await toolRegistry.executeTool('geogebra_plot_implicit', {
      name: 'hyperbola',
      expression: 'x^2 - y^2 - 1',
      color: '#FF8000',
      thickness: 2,
      style: 'dashed'
    });
    
    const hyperbolaResponse = JSON.parse(hyperbola.content[0]?.text!);
    console.log(`   ✓ Hyperbola: ${hyperbolaResponse.command}`);

    // Plot a more complex implicit curve (folium of Descartes)
    const folium = await toolRegistry.executeTool('geogebra_plot_implicit', {
      name: 'folium',
      expression: 'x^3 + y^3 - 3*x*y',
      color: '#4080FF',
      thickness: 2
    });
    
    const foliumResponse = JSON.parse(folium.content[0]?.text!);
    console.log(`   ✓ Folium of Descartes: ${foliumResponse.command}\n`);

    // Demo 4: Multiple Function Types Together
    console.log('🎨 Demo 4: Mathematical Gallery');
    
    // Add some additional interesting functions
    const functions = [
      {
        type: 'function',
        name: 'cubic',
        params: { name: 'cubic', expression: 'x^3 - 3*x', color: '#FF4040', thickness: 2 }
      },
      {
        type: 'parametric',
        name: 'heart',
        params: { 
          name: 'heart', 
          xExpression: '16*sin(t)^3', 
          yExpression: '13*cos(t) - 5*cos(2*t) - 2*cos(3*t) - cos(4*t)',
          parameter: 't',
          tMin: 0,
          tMax: 6.28,
          color: '#FF1493',
          thickness: 3
        }
      },
      {
        type: 'implicit',
        name: 'astroid',
        params: { name: 'astroid', expression: 'x^(2/3) + y^(2/3) - 1', color: '#40FF40', thickness: 2 }
      }
    ];

    for (const func of functions) {
      let toolName: string;
      switch (func.type) {
        case 'function':
          toolName = 'geogebra_plot_function';
          break;
        case 'parametric':
          toolName = 'geogebra_plot_parametric';
          break;
        case 'implicit':
          toolName = 'geogebra_plot_implicit';
          break;
        default:
          continue;
      }

      const result = await toolRegistry.executeTool(toolName, func.params);
      const response = JSON.parse(result.content[0]?.text!);
      console.log(`   ✓ ${func.name}: ${response.success ? 'Created successfully' : 'Failed'}`);
    }

    // Demo 5: Get all objects and export
    console.log('\n📋 Demo 5: Construction Summary and Export');
    
    const objects = await toolRegistry.executeTool('geogebra_get_objects', {});
    const objectsResponse = JSON.parse(objects.content[0]?.text!);
    
    console.log(`   ✓ Total objects created: ${objectsResponse.objectCount}`);
    console.log('   📄 Function summary:');
    
    objectsResponse.objects.forEach((obj: any) => {
      const typeIcon = obj.type === 'function' ? '📈' : 
                      obj.type === 'curve' ? '🌀' : 
                      obj.type === 'implicitcurve' ? '🔄' : '📐';
      console.log(`     ${typeIcon} ${obj.name} (${obj.type}): ${obj.value || 'geometric object'}`);
    });

    // Export the construction
    console.log('\n   🖼️  Exporting mathematical gallery...');
    const exportResult = await toolRegistry.executeTool('geogebra_export_png', {
      xmin: -5,
      xmax: 5,
      ymin: -5,
      ymax: 5,
      scale: 2,
      showAxes: true,
      showGrid: true
    });
    
    const exportResponse = JSON.parse(exportResult.content[0]?.text!);
    console.log(`   ✓ PNG exported: ${exportResponse.data.length} characters (base64)`);

    // Demo 6: Error Handling Examples
    console.log('\n❌ Demo 6: Validation and Error Handling');
    
    // Test invalid function expression
    const invalidFunc = await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'invalid',
      expression: 'x^2 + invalid@'
    });
    const invalidResponse = JSON.parse(invalidFunc.content[0]?.text!);
    console.log(`   ✓ Function validation: ${invalidResponse.error}`);

    // Test invalid parametric expression
    const invalidParam = await toolRegistry.executeTool('geogebra_plot_parametric', {
      name: 'invalid_param',
      xExpression: 'cos(x)', // Should use parameter 't'
      yExpression: 'sin(t)',
      parameter: 't',
      tMin: 0,
      tMax: 1
    });
    const invalidParamResponse = JSON.parse(invalidParam.content[0]?.text!);
    console.log(`   ✓ Parametric validation: ${invalidParamResponse.error}`);

    // Test invalid implicit expression
    const invalidImplicit = await toolRegistry.executeTool('geogebra_plot_implicit', {
      name: 'invalid_implicit',
      expression: 'x^2 - 4' // Missing y variable
    });
    const invalidImplicitResponse = JSON.parse(invalidImplicit.content[0]?.text!);
    console.log(`   ✓ Implicit validation: ${invalidImplicitResponse.error}`);

    console.log('\n🎉 Function plotting demo completed successfully!');
    console.log('\n📋 GEB-5 Implementation Summary:');
    console.log('   ✅ Standard function plotting f(x) = expression');
    console.log('   ✅ Parametric curve plotting x(t), y(t)');
    console.log('   ✅ Implicit curve plotting F(x,y) = 0');
    console.log('   ✅ Domain and range configuration');
    console.log('   ✅ Function styling (color, thickness, style)');
    console.log('   ✅ Comprehensive parameter validation');
    console.log('   ✅ Integration with existing tools and export');
    console.log('   ✅ Support for mathematical functions (sin, cos, exp, etc.)');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateFunctionPlotting().catch(console.error);
}

export { demonstrateFunctionPlotting }; 
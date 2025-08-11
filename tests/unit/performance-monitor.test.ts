import { performanceMonitor } from '../../src/utils/performance';

describe('PerformanceMonitor getStats', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  test('calculates median correctly for even number of durations', () => {
    const monitor: any = performanceMonitor as any;
    monitor.metrics = [
      { operationName: 'op', startTime: 0, endTime: 0, duration: 100, success: true },
      { operationName: 'op', startTime: 0, endTime: 0, duration: 200, success: true },
      { operationName: 'op', startTime: 0, endTime: 0, duration: 300, success: true },
      { operationName: 'op', startTime: 0, endTime: 0, duration: 400, success: true }
    ];

    const stats = performanceMonitor.getStats('op');
    expect(stats.medianDuration).toBe(250);
  });

  test('calculates median correctly for odd number of durations', () => {
    const monitor: any = performanceMonitor as any;
    monitor.metrics = [
      { operationName: 'op', startTime: 0, endTime: 0, duration: 100, success: true },
      { operationName: 'op', startTime: 0, endTime: 0, duration: 200, success: true },
      { operationName: 'op', startTime: 0, endTime: 0, duration: 300, success: true }
    ];

    const stats = performanceMonitor.getStats('op');
    expect(stats.medianDuration).toBe(200);
  });
});

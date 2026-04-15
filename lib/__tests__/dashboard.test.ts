import { describe, it, expect } from 'vitest';
import { getDashboardData } from '@/lib/queries';

describe('getDashboardData', () => {
  it('returns correct shape with seeded 7-product catalog', async () => {
    const data = await getDashboardData();

    expect(typeof data.stats.total).toBe('number');
    expect(typeof data.stats.avgScore).toBe('number');
    expect(typeof data.stats.lowScoreCount).toBe('number');
    expect(typeof data.stats.onSaleCount).toBe('number');
    expect(typeof data.stats.catalogRevenue).toBe('number');

    const distSum =
      data.distribution.red + data.distribution.yellow +
      data.distribution.blue + data.distribution.green;
    expect(distSum).toBe(data.stats.total);

    expect(data.stats.total).toBe(7);

    expect(data.tabCompletion.length).toBe(5);
    for (const tc of data.tabCompletion) {
      expect(typeof tc.tab).toBe('string');
      expect(tc.metPct).toBeGreaterThanOrEqual(0);
      expect(tc.metPct).toBeLessThanOrEqual(100);
    }

    for (const row of data.alerts) {
      expect(row.score.total).toBeLessThan(50);
    }

    for (let i = 1; i < data.alerts.length; i++) {
      expect(data.alerts[i].score.total).toBeGreaterThanOrEqual(data.alerts[i - 1].score.total);
    }
  });

  it('avgScore is within 0-100', async () => {
    const data = await getDashboardData();
    expect(data.stats.avgScore).toBeGreaterThanOrEqual(0);
    expect(data.stats.avgScore).toBeLessThanOrEqual(100);
  });
});

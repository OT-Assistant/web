import { calculateWeeklyCompletionRate } from './progress-metrics';

describe('calculateWeeklyCompletionRate', () => {
  it('counts unique activities completed during the last seven days', () => {
    const now = new Date('2026-06-20T12:00:00.000Z');
    const activities = [{ id: 'activity-1' }, { id: 'activity-2' }, { id: 'activity-3' }];
    const completions = [
      { activity_id: 'activity-1', completed_at: '2026-06-20T08:00:00.000Z' },
      { activity_id: 'activity-1', completed_at: '2026-06-19T08:00:00.000Z' },
      { activity_id: 'activity-2', completed_at: '2026-06-14T08:00:00.000Z' },
      { activity_id: 'activity-3', completed_at: '2026-06-01T08:00:00.000Z' },
    ];

    expect(calculateWeeklyCompletionRate(activities, completions, now)).toBe(67);
  });

  it('returns zero when there are no activities', () => {
    expect(calculateWeeklyCompletionRate([], [], new Date('2026-06-20T12:00:00.000Z'))).toBe(0);
  });
});

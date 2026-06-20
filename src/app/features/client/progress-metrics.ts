export interface ProgressActivity {
  id: string;
}

export interface ProgressCompletion {
  activity_id: string;
  completed_at?: string | null;
}

export function calculateWeeklyCompletionRate(
  activities: ProgressActivity[],
  completions: ProgressCompletion[],
  now = new Date()
): number {
  if (activities.length === 0) return 0;

  const activityIds = new Set(activities.map(activity => activity.id));
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const completedActivityIds = new Set<string>();
  for (const completion of completions) {
    if (!activityIds.has(completion.activity_id) || !completion.completed_at) continue;

    const completedAt = new Date(completion.completed_at);
    if (Number.isNaN(completedAt.getTime())) continue;
    if (completedAt >= weekStart && completedAt <= now) {
      completedActivityIds.add(completion.activity_id);
    }
  }

  return Math.round((completedActivityIds.size / activities.length) * 100);
}

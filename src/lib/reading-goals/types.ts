export type AnnualReadingGoal = Readonly<{
  id: string;
  year: number;
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}>;

export type AnnualReadingGoalProgress = Readonly<{
  year: number;
  targetCount: number;
  currentCount: number;
  remainingCount: number;
  achieved: boolean;
  exceeded: boolean;
}>;

export type WeeklyReadingStreak = Readonly<{
  current: number;
  longest: number;
}>;

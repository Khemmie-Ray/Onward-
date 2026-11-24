
-- Point source for the weekly quest board prizes (top 3).
-- Enum additions live in their own migration.
ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'leaderboard_quests';
-- New point sources for quests, milestones and staged quality referrals.
--
-- Kept in its own migration on purpose: Postgres cannot use an enum value in
-- the same transaction that adds it, so nothing else lives in this file.

ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'daily_quest';
ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'monthly_quest';
ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'milestone';
ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'referral_quality';
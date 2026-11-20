create or replace function public.reset_stale_streaks()
returns integer
language sql
security definer
set search_path = public
as $$
  with reset as (
    update public.users u
    set current_streak = 0
    where u.current_streak > 0
      and not exists (
        select 1
        from public.streak_days d
        where d.user_id = u.id
          and d.passed
          -- 4-day grace before a lapsed streak drops to 0.
          -- Armed freezes get 7 so a pending freeze can still bridge the gap.
          and d.day >= (now() at time zone 'utc')::date
                       - case when u.freeze_armed_on is null then 4 else 7 end
      )
    returning 1
  )
  select count(*)::int from reset;
$$;

revoke all on function public.reset_stale_streaks() from public, anon, authenticated;
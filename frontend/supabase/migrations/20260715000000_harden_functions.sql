
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer, public.point_source, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer, public.point_source, text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer, public.point_source, text, jsonb) FROM public;


ALTER FUNCTION public.award_points(uuid, integer, public.point_source, text, jsonb)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.tg_set_updated_at()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_referral_code()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.set_referral_code_on_insert()
  SET search_path = public, pg_temp;
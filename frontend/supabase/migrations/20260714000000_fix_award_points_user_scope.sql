CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_delta integer,
  p_source point_source,
  p_reference_id text,
  p_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS TABLE(new_balance integer, was_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_existing_id uuid;
  v_new_balance integer;
BEGIN

  SELECT id INTO v_existing_id
  FROM point_transactions
  WHERE user_id = p_user_id
    AND source = p_source
    AND reference_id = p_reference_id;

  IF v_existing_id IS NOT NULL THEN
    SELECT balance INTO v_new_balance
    FROM user_points
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT COALESCE(v_new_balance, 0), false;
    RETURN;
  END IF;

  INSERT INTO point_transactions (user_id, delta, source, reference_id, metadata)
  VALUES (p_user_id, p_delta, p_source, p_reference_id, p_metadata);

  INSERT INTO user_points (user_id, balance, lifetime_earned, lifetime_claimed)
  VALUES (
    p_user_id,
    p_delta,
    CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END,
    CASE WHEN p_delta < 0 THEN -p_delta ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    balance = user_points.balance + p_delta,
    lifetime_earned = user_points.lifetime_earned +
      CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END,
    lifetime_claimed = user_points.lifetime_claimed +
      CASE WHEN p_delta < 0 THEN -p_delta ELSE 0 END,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN QUERY SELECT v_new_balance, true;
END;
$function$
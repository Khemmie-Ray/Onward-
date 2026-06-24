
CREATE OR REPLACE FUNCTION award_points(
  p_user_id       uuid,
  p_delta         integer,
  p_source        point_source,
  p_reference_id  text,
  p_metadata      jsonb DEFAULT NULL
)
RETURNS TABLE (
  new_balance integer,
  was_new     boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_id     uuid;
  v_earned_increment integer;
  v_claimed_increment integer;
BEGIN
  -- Guardrails
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'award_points: delta cannot be zero';
  END IF;
  IF p_reference_id IS NULL OR p_reference_id = '' THEN
    RAISE EXCEPTION 'award_points: reference_id required for idempotency';
  END IF;

  INSERT INTO point_transactions (user_id, delta, source, reference_id, metadata)
  VALUES (p_user_id, p_delta, p_source, p_reference_id, p_metadata)
  ON CONFLICT (user_id, source, reference_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    RETURN QUERY
    SELECT up.balance, false
    FROM user_points up
    WHERE up.user_id = p_user_id;
    RETURN;
  END IF;

  v_earned_increment := CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END;
  v_claimed_increment := CASE
    WHEN p_delta < 0 AND p_source = 'claim_redemption' THEN -p_delta
    ELSE 0
  END;

  INSERT INTO user_points (user_id, balance, lifetime_earned, lifetime_claimed, updated_at)
  VALUES (p_user_id, p_delta, v_earned_increment, v_claimed_increment, now())
  ON CONFLICT (user_id) DO UPDATE SET
    balance          = user_points.balance + p_delta,
    lifetime_earned  = user_points.lifetime_earned + v_earned_increment,
    lifetime_claimed = user_points.lifetime_claimed + v_claimed_increment,
    updated_at       = now();

  RETURN QUERY
  SELECT up.balance, true
  FROM user_points up
  WHERE up.user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION award_points IS
  'Atomic point movement. Inserts an audit log row and updates user_points balance in one transaction. Idempotent on (user_id, source, reference_id). Returns the new balance and whether the call was a new write or a replay no-op.';
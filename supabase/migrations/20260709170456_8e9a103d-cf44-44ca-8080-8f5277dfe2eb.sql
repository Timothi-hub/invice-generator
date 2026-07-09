
-- 1) user_account_status table
CREATE TABLE IF NOT EXISTS public.user_account_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.user_account_status TO authenticated;
GRANT ALL ON public.user_account_status TO service_role;

ALTER TABLE public.user_account_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own status" ON public.user_account_status;
CREATE POLICY "Users can read own status"
ON public.user_account_status FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- writes only via SECURITY DEFINER RPCs; no direct write policies

-- 2) get_my_account_status
CREATE OR REPLACE FUNCTION public.get_my_account_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exp timestamptz;
  v_admin boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('expires_at', NULL, 'is_admin', false, 'expired', false);
  END IF;
  SELECT expires_at INTO v_exp FROM public.user_account_status WHERE user_id = v_uid;
  v_admin := public.has_role(v_uid, 'admin');
  RETURN jsonb_build_object(
    'expires_at', v_exp,
    'is_admin', v_admin,
    'expired', (v_exp IS NOT NULL AND v_exp < now() AND NOT v_admin)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_account_status() TO authenticated;

-- 3) admin_grant_admin_by_email
CREATE OR REPLACE FUNCTION public.admin_grant_admin_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  SELECT id INTO v_target FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'No user found with email %', _email;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_target, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_admin_by_email(text) TO authenticated;

-- 4) admin_revoke_admin
CREATE OR REPLACE FUNCTION public.admin_revoke_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot revoke your own admin role';
  END IF;
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke the last remaining admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_admin(uuid) TO authenticated;

-- 5) admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account here';
  END IF;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- 6) admin_set_expiry
CREATE OR REPLACE FUNCTION public.admin_set_expiry(_user_id uuid, _expires_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  INSERT INTO public.user_account_status (user_id, expires_at, updated_by, updated_at)
  VALUES (_user_id, _expires_at, auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at,
        updated_by = EXCLUDED.updated_by,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_expiry(uuid, timestamptz) TO authenticated;

-- 7) admin_list_users — add last_sign_in_at (active date)
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean,
  invoice_count bigint,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY
    SELECT u.id,
      u.email::text,
      u.created_at,
      u.last_sign_in_at,
      EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
      (SELECT count(*) FROM public.invoices i WHERE i.user_id = u.id),
      (SELECT s.expires_at FROM public.user_account_status s WHERE s.user_id = u.id)
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

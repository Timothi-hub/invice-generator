
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
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
    SELECT u.id, u.email::text, u.created_at,
      EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
      (SELECT count(*) FROM public.invoices i WHERE i.user_id = u.id),
      (SELECT s.expires_at FROM public.user_account_status s WHERE s.user_id = u.id)
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;


REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_account(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_account_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_account(uuid) TO authenticated;

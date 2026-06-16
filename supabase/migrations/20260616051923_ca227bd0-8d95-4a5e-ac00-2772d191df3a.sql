
-- Collaborators table
CREATE TABLE public.account_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  member_email text NOT NULL,
  member_user_id uuid,
  role text NOT NULL DEFAULT 'editor',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, member_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_members TO authenticated;
GRANT ALL ON public.account_members TO service_role;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_account_members_updated_at
  BEFORE UPDATE ON public.account_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer: current user's email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid()
$$;

-- Security definer: can current user access this owner's data?
CREATE OR REPLACE FUNCTION public.can_access_account(_owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _owner = auth.uid() OR EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.owner_id = _owner
      AND (m.member_user_id = auth.uid()
           OR lower(m.member_email) = public.current_user_email())
  )
$$;

-- account_members RLS
CREATE POLICY "Owners manage their members" ON public.account_members
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members view their own membership" ON public.account_members
  FOR SELECT USING (
    member_user_id = auth.uid()
    OR lower(member_email) = public.current_user_email()
  );

-- Link member_user_id when invited email signs up
CREATE OR REPLACE FUNCTION public.link_account_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.account_members
    SET member_user_id = NEW.id, updated_at = now()
    WHERE lower(member_email) = lower(NEW.email)
      AND member_user_id IS NULL;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_link_member ON auth.users;
CREATE TRIGGER on_auth_user_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_account_member();

-- Invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "View accessible invoices" ON public.invoices FOR SELECT USING (public.can_access_account(user_id));
CREATE POLICY "Insert accessible invoices" ON public.invoices FOR INSERT WITH CHECK (public.can_access_account(user_id));
CREATE POLICY "Update accessible invoices" ON public.invoices FOR UPDATE USING (public.can_access_account(user_id)) WITH CHECK (public.can_access_account(user_id));
CREATE POLICY "Delete accessible invoices" ON public.invoices FOR DELETE USING (public.can_access_account(user_id));

-- Invoice items (access via parent invoice owner)
DROP POLICY IF EXISTS "Users can view their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can create their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete their invoice items" ON public.invoice_items;
CREATE POLICY "View accessible invoice items" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND public.can_access_account(i.user_id))
);
CREATE POLICY "Insert accessible invoice items" ON public.invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND public.can_access_account(i.user_id))
);
CREATE POLICY "Update accessible invoice items" ON public.invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND public.can_access_account(i.user_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND public.can_access_account(i.user_id))
);
CREATE POLICY "Delete accessible invoice items" ON public.invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND public.can_access_account(i.user_id))
);

-- Customers
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
CREATE POLICY "View accessible customers" ON public.customers FOR SELECT USING (public.can_access_account(user_id));
CREATE POLICY "Insert accessible customers" ON public.customers FOR INSERT WITH CHECK (public.can_access_account(user_id));
CREATE POLICY "Update accessible customers" ON public.customers FOR UPDATE USING (public.can_access_account(user_id)) WITH CHECK (public.can_access_account(user_id));
CREATE POLICY "Delete accessible customers" ON public.customers FOR DELETE USING (public.can_access_account(user_id));

-- Saved items
DROP POLICY IF EXISTS "Users select own saved_items" ON public.saved_items;
DROP POLICY IF EXISTS "Users insert own saved_items" ON public.saved_items;
DROP POLICY IF EXISTS "Users update own saved_items" ON public.saved_items;
DROP POLICY IF EXISTS "Users delete own saved_items" ON public.saved_items;
CREATE POLICY "View accessible saved_items" ON public.saved_items FOR SELECT USING (public.can_access_account(user_id));
CREATE POLICY "Insert accessible saved_items" ON public.saved_items FOR INSERT WITH CHECK (public.can_access_account(user_id));
CREATE POLICY "Update accessible saved_items" ON public.saved_items FOR UPDATE USING (public.can_access_account(user_id)) WITH CHECK (public.can_access_account(user_id));
CREATE POLICY "Delete accessible saved_items" ON public.saved_items FOR DELETE USING (public.can_access_account(user_id));

-- Profiles (collaborators can read owner profile for branding; only owner edits own)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "View accessible profiles" ON public.profiles FOR SELECT USING (public.can_access_account(user_id));

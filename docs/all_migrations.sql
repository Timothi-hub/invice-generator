-- ============================================
-- Migration: 20260124052956_1a0ccef4-ddab-471e-8ab1-54f8323471a4.sql
-- ============================================
-- Create profiles table for user company settings
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT DEFAULT 'Your Company',
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    website TEXT,
    director_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_name TEXT NOT NULL,
    customer_address TEXT,
    delivery_charges NUMERIC(10,2) DEFAULT 0,
    designing_charges NUMERIC(10,2) DEFAULT 0,
    expenses NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
ON public.invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON public.invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON public.invoices FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for invoice items (via invoice ownership)
CREATE POLICY "Users can view their invoice items"
ON public.invoice_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can create their invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can update their invoice items"
ON public.invoice_items FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Users can delete their invoice items"
ON public.invoice_items FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
));

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Migration: 20260202170857_0b7b44da-0912-4675-9c93-37c2dd42bbcf.sql
-- ============================================
-- Create customers table
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own customers" 
ON public.customers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers" 
ON public.customers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" 
ON public.customers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" 
ON public.customers FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add customer_id reference to invoices (optional link)
ALTER TABLE public.invoices ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- ============================================
-- Migration: 20260612042451_d2eabbea-cf78-424c-9902-29d9a9695b27.sql
-- ============================================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;

-- ============================================
-- Migration: 20260612043139_dd7b1da0-e06e-4f1d-8bb4-71320bacb80d.sql
-- ============================================
-- Add unit column to invoice_items
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'pcs';

-- Create saved_items (catalog) table
CREATE TABLE IF NOT EXISTS public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pcs',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, description)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own saved_items" ON public.saved_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved_items" ON public.saved_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved_items" ON public.saved_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own saved_items" ON public.saved_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_items_updated_at
  BEFORE UPDATE ON public.saved_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Migration: 20260613113651_5b1027a1-44cd-4173-aa31-72f225f127d8.sql
-- ============================================
ALTER TABLE public.invoice_items 
  ADD COLUMN IF NOT EXISTS width numeric,
  ADD COLUMN IF NOT EXISTS height numeric;

-- ============================================
-- Migration: 20260615182152_84b5bdaa-ceb5-42b2-a10f-bc1930c92ac1.sql
-- ============================================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS advance NUMERIC NOT NULL DEFAULT 0;

-- ============================================
-- Migration: 20260616051923_ca227bd0-8d95-4a5e-ac00-2772d191df3a.sql
-- ============================================

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


-- ============================================
-- Migration: 20260616051935_cb3546b6-bda2-4ab2-bcb5-b0231ed370e5.sql
-- ============================================

REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_account(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_account_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_account(uuid) TO authenticated;


-- ============================================
-- Migration: 20260622173522_0e883ebf-8b4d-49c9-91e4-fe23be5462eb.sql
-- ============================================

ALTER TABLE public.saved_items
  ADD COLUMN IF NOT EXISTS width numeric,
  ADD COLUMN IF NOT EXISTS height numeric,
  ADD COLUMN IF NOT EXISTS pieces integer,
  ADD COLUMN IF NOT EXISTS mrp numeric,
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0;

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS pieces integer,
  ADD COLUMN IF NOT EXISTS mrp numeric,
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0;


-- ============================================
-- Migration: 20260625063602_d4860464-8200-41fd-a02e-0c2b34a33cf9.sql
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_members TO authenticated;
GRANT ALL ON public.customers, public.profiles, public.invoices, public.invoice_items, public.saved_items, public.account_members TO service_role;


-- ============================================
-- Migration: 20260630072448_d6e9c61d-b9de-4d80-9b68-b19f366cc76e.sql
-- ============================================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT;


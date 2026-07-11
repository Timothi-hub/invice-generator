
-- Enhanced admin_delete_user: purge all user-owned rows before deleting auth user
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

  -- Delete dependent invoice items via invoices cascade; explicit deletes for safety
  DELETE FROM public.invoice_items WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id = _user_id);
  DELETE FROM public.invoices WHERE user_id = _user_id;
  DELETE FROM public.customers WHERE user_id = _user_id;
  DELETE FROM public.saved_items WHERE user_id = _user_id;
  DELETE FROM public.error_logs WHERE user_id = _user_id;
  DELETE FROM public.account_members WHERE owner_id = _user_id OR member_user_id = _user_id;
  DELETE FROM public.user_account_status WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;

  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Backup: return full JSON snapshot of a user's data
CREATE OR REPLACE FUNCTION public.admin_export_user_data(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;

  SELECT jsonb_build_object(
    'version', 1,
    'exported_at', now(),
    'user_id', _user_id,
    'email', v_email,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = _user_id),
    'customers', COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM public.customers c WHERE c.user_id = _user_id), '[]'::jsonb),
    'saved_items', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM public.saved_items s WHERE s.user_id = _user_id), '[]'::jsonb),
    'invoices', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'invoice', to_jsonb(i),
        'items', COALESCE((SELECT jsonb_agg(to_jsonb(it)) FROM public.invoice_items it WHERE it.invoice_id = i.id), '[]'::jsonb)
      ))
      FROM public.invoices i WHERE i.user_id = _user_id
    ), '[]'::jsonb),
    'account_status', (SELECT to_jsonb(a) FROM public.user_account_status a WHERE a.user_id = _user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Restore: wipe target user's data and re-insert from JSON bundle
CREATE OR REPLACE FUNCTION public.admin_import_user_data(_user_id uuid, _data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prof jsonb;
  v_cust jsonb;
  v_item jsonb;
  v_inv  jsonb;
  v_inv_row jsonb;
  v_it_row jsonb;
  v_new_invoice_id uuid;
  v_cust_count int := 0;
  v_inv_count int := 0;
  v_item_count int := 0;
  v_saved_count int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  IF _data IS NULL OR jsonb_typeof(_data) <> 'object' THEN
    RAISE EXCEPTION 'Invalid backup payload';
  END IF;

  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  -- Wipe existing data (keeps auth user, roles, memberships, expiry)
  DELETE FROM public.invoice_items WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id = _user_id);
  DELETE FROM public.invoices WHERE user_id = _user_id;
  DELETE FROM public.customers WHERE user_id = _user_id;
  DELETE FROM public.saved_items WHERE user_id = _user_id;

  -- Profile (upsert)
  v_prof := _data -> 'profile';
  IF v_prof IS NOT NULL AND jsonb_typeof(v_prof) = 'object' THEN
    INSERT INTO public.profiles (user_id, company_name, logo_url, address, phone, website, director_name)
    VALUES (
      _user_id,
      v_prof->>'company_name',
      v_prof->>'logo_url',
      v_prof->>'address',
      v_prof->>'phone',
      v_prof->>'website',
      v_prof->>'director_name'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      logo_url = EXCLUDED.logo_url,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      website = EXCLUDED.website,
      director_name = EXCLUDED.director_name,
      updated_at = now();
  END IF;

  -- Customers: preserve ids so invoices can reference them
  FOR v_cust IN SELECT jsonb_array_elements(COALESCE(_data->'customers', '[]'::jsonb)) LOOP
    INSERT INTO public.customers (id, user_id, name, address, phone, email, notes)
    VALUES (
      COALESCE((v_cust->>'id')::uuid, gen_random_uuid()),
      _user_id,
      v_cust->>'name',
      v_cust->>'address',
      v_cust->>'phone',
      v_cust->>'email',
      v_cust->>'notes'
    );
    v_cust_count := v_cust_count + 1;
  END LOOP;

  -- Saved items
  FOR v_item IN SELECT jsonb_array_elements(COALESCE(_data->'saved_items', '[]'::jsonb)) LOOP
    INSERT INTO public.saved_items (user_id, description, price, unit, width, height, pieces, mrp, tax_rate)
    VALUES (
      _user_id,
      v_item->>'description',
      COALESCE((v_item->>'price')::numeric, 0),
      COALESCE(v_item->>'unit', 'pcs'),
      NULLIF(v_item->>'width','')::numeric,
      NULLIF(v_item->>'height','')::numeric,
      NULLIF(v_item->>'pieces','')::int,
      NULLIF(v_item->>'mrp','')::numeric,
      COALESCE((v_item->>'tax_rate')::numeric, 0)
    )
    ON CONFLICT (user_id, description) DO NOTHING;
    v_saved_count := v_saved_count + 1;
  END LOOP;

  -- Invoices + items
  FOR v_inv IN SELECT jsonb_array_elements(COALESCE(_data->'invoices', '[]'::jsonb)) LOOP
    v_inv_row := v_inv->'invoice';
    IF v_inv_row IS NULL THEN CONTINUE; END IF;

    INSERT INTO public.invoices (
      id, user_id, invoice_number, invoice_date, customer_name, customer_address,
      customer_phone, customer_id, delivery_charges, designing_charges, expenses,
      discount, advance, notes, terms_conditions
    ) VALUES (
      COALESCE((v_inv_row->>'id')::uuid, gen_random_uuid()),
      _user_id,
      v_inv_row->>'invoice_number',
      COALESCE((v_inv_row->>'invoice_date')::date, CURRENT_DATE),
      v_inv_row->>'customer_name',
      v_inv_row->>'customer_address',
      v_inv_row->>'customer_phone',
      NULLIF(v_inv_row->>'customer_id','')::uuid,
      COALESCE((v_inv_row->>'delivery_charges')::numeric, 0),
      COALESCE((v_inv_row->>'designing_charges')::numeric, 0),
      COALESCE((v_inv_row->>'expenses')::numeric, 0),
      COALESCE((v_inv_row->>'discount')::numeric, 0),
      COALESCE((v_inv_row->>'advance')::numeric, 0),
      v_inv_row->>'notes',
      v_inv_row->>'terms_conditions'
    )
    RETURNING id INTO v_new_invoice_id;

    FOR v_it_row IN SELECT jsonb_array_elements(COALESCE(v_inv->'items', '[]'::jsonb)) LOOP
      INSERT INTO public.invoice_items (
        invoice_id, quantity, description, price, unit, width, height, pieces, mrp, tax_rate
      ) VALUES (
        v_new_invoice_id,
        COALESCE((v_it_row->>'quantity')::int, 1),
        v_it_row->>'description',
        COALESCE((v_it_row->>'price')::numeric, 0),
        COALESCE(v_it_row->>'unit', 'pcs'),
        NULLIF(v_it_row->>'width','')::numeric,
        NULLIF(v_it_row->>'height','')::numeric,
        NULLIF(v_it_row->>'pieces','')::int,
        NULLIF(v_it_row->>'mrp','')::numeric,
        COALESCE((v_it_row->>'tax_rate')::numeric, 0)
      );
      v_item_count := v_item_count + 1;
    END LOOP;
    v_inv_count := v_inv_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'restored', true,
    'customers', v_cust_count,
    'invoices', v_inv_count,
    'invoice_items', v_item_count,
    'saved_items', v_saved_count
  );
END;
$$;

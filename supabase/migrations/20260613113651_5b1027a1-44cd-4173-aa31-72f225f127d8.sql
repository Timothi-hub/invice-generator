ALTER TABLE public.invoice_items 
  ADD COLUMN IF NOT EXISTS width numeric,
  ADD COLUMN IF NOT EXISTS height numeric;
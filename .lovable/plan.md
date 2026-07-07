## Admin Dashboard Plan

Build a separate admin-only dashboard at `/admin` where designated admin users can see total stats (users, invoices, customers) and view/download error logs collected from all users.

### 1. Database (migration)

- Create `app_role` enum: `'admin' | 'user'`
- Create `user_roles` table (`id`, `user_id -> auth.users`, `role`, `created_at`, unique on `user_id, role`)
  - GRANT select to authenticated, ALL to service_role
  - RLS: users can read their own role; admins can read all
- Create `has_role(_user_id, _role)` SECURITY DEFINER function (standard pattern)
- Create `error_logs` table (`id`, `user_id`, `type`, `message`, `stack`, `source`, `url`, `user_agent`, `created_at`)
  - GRANT insert to authenticated + anon (so all clients can report), select to authenticated
  - RLS: authenticated users can insert their own rows; only admins can select
- Add admin-only stats RPCs (SECURITY DEFINER):
  - `admin_get_stats()` → returns `{ total_users, total_accounts, total_invoices, total_customers, total_errors }`
  - Guards with `has_role(auth.uid(), 'admin')` else raises exception

### 2. Error logger update (`src/lib/errorLogger.ts`)

- Keep existing localStorage behavior
- Additionally push each new entry to `error_logs` table via supabase insert (fire-and-forget, swallow failures)

### 3. Admin auth & routing

- New hook `useIsAdmin()` — queries `user_roles` for current user
- New `AdminRoute` wrapper — redirects non-admins to `/`
- Add route `/admin` in `src/App.tsx`
- Sidebar: show "Admin" menu item only when `isAdmin`

### 4. Admin page (`src/pages/AdminPage.tsx`)

Sections:
- **Stat cards**: Total Users, Total Invoices, Total Customers, Total Errors (calls `admin_get_stats` RPC)
- **Recent Error Logs** table (from `error_logs`): timestamp, user_id, type, message, source; with Refresh, Download all as .txt, Clear (admin-only delete)
- **Users list**: show emails from `profiles` join with roles

### 5. Bootstrapping first admin

- Provide a small note/UI on the page telling the current user how to be promoted (via SQL insert). Also seed the current authenticated user as admin if the `user_roles` table is empty (one-time bootstrap in the RPC).

### Technical Details

- Files added: `supabase/migrations/*_admin_dashboard.sql`, `src/pages/AdminPage.tsx`, `src/components/AdminRoute.tsx`, `src/hooks/useIsAdmin.ts`
- Files edited: `src/App.tsx`, `src/components/AppSidebar.tsx`, `src/lib/errorLogger.ts`
- Uses existing shadcn UI (Card, Table, Button, ScrollArea)
- No changes to existing invoice/customer flows

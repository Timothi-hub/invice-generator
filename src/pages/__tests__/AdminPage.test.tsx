import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- Mocks ---

const mockIsAdmin = vi.fn();
vi.mock("@/hooks/useIsAdmin", () => ({
  useIsAdmin: () => mockIsAdmin(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", email: "me@example.com" }, loading: false }),
}));

vi.mock("@/components/AppLayout", () => ({
  __esModule: true,
  default: ({ children, title }: any) => (
    <div data-testid="app-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const rpc = vi.fn();
const from = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => rpc(...args),
    from: (...args: any[]) => from(...args),
  },
}));

// Silence sonner in tests
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import AdminPage from "../AdminPage";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<div data-testid="home">HOME</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
  mockIsAdmin.mockReset();
});

describe("AdminPage", () => {
  it("renders while admin-check is loading without throwing (hook-order sanity)", () => {
    mockIsAdmin.mockReturnValue({ isAdmin: false, loading: true });
    // No RPC calls should happen while loading; still safe if they do.
    rpc.mockResolvedValue({ data: null, error: null });
    from.mockReturnValue({
      select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
    });

    expect(() => renderPage()).not.toThrow();
    expect(screen.getByText(/Checking access/i)).toBeInTheDocument();
  });

  it("redirects non-admins away from /admin when the admin RPC denies access", async () => {
    mockIsAdmin.mockReturnValue({ isAdmin: false, loading: false });
    // Both bootstrap call and load() call fail with 'Admins only' for non-admin.
    rpc.mockResolvedValue({ data: null, error: { message: "Admins only" } });
    from.mockReturnValue({
      select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: { message: "Admins only" } }) }) }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("home")).toBeInTheDocument();
    });
  });

  it("renders the admin dashboard for admin users", async () => {
    mockIsAdmin.mockReturnValue({ isAdmin: true, loading: false });
    rpc.mockImplementation((name: string) => {
      if (name === "admin_get_stats") {
        return Promise.resolve({
          data: {
            total_users: 3,
            total_profiles: 3,
            total_invoices: 5,
            total_customers: 2,
            total_saved_items: 1,
            total_errors: 0,
            total_admins: 1,
          },
          error: null,
        });
      }
      if (name === "admin_list_users") {
        return Promise.resolve({
          data: [
            {
              user_id: "u1",
              email: "me@example.com",
              created_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString(),
              is_admin: true,
              invoice_count: 2,
              expires_at: null,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
    from.mockReturnValue({
      select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/me@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/Last active/i)).toBeInTheDocument();
    });
  });
});
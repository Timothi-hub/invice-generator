import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AccountStatus = {
  expires_at: string | null;
  is_admin: boolean;
  expired: boolean;
};

export function useAccountStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (supabase.rpc as any)("get_my_account_status").then(({ data }: any) => {
      if (cancelled) return;
      setStatus((data as AccountStatus) ?? { expires_at: null, is_admin: false, expired: false });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { status, loading };
}
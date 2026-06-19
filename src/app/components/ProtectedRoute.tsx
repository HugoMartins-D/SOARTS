import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { createClient } from "@/utils/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

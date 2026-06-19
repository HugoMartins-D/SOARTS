import { useState } from "react";
import { useNavigate } from "react-router";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
    } else {
      navigate("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 font-['Inter',sans-serif]">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-3xl font-extrabold text-center mb-2 tracking-tight">SOARTS</h1>
        <p className="text-white/50 text-center mb-8 text-sm">Acesso restrito</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff9000] transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm block mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff9000] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff9000] text-white font-bold py-3 rounded-lg hover:bg-[#e08000] transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

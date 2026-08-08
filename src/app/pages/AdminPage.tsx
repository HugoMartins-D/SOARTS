import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { publicMediaUrl, type ProjectRow } from "@/utils/projects";
import type { LeadRow } from "@/utils/leads";
import { compressVideo } from "@/utils/compressVideo";

const ORANGE = "#FF5200";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("E-mail ou senha incorretos.");
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="liquid-glass rounded-3xl p-8 w-full max-w-sm space-y-4">
        <div>
          <p className="text-xs tracking-[0.3em] font-semibold mb-1" style={{ color: ORANGE }}>
            SOARTS
          </p>
          <h1 className="text-2xl font-extrabold">Área do admin</h1>
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-1">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF5200] transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-1">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF5200] transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-bold py-3 rounded-full transition-colors disabled:opacity-50"
          style={{ backgroundColor: ORANGE }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const emptyForm = {
  title: "",
  category: "video" as "video" | "foto",
  tag: "",
  description: "",
};

function Dashboard() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [compressProgress, setCompressProgress] = useState<number | null>(null);

  const loadProjects = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    setProjects(data ?? []);
    setLoadingList(false);
  }, []);

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data ?? []);
    setLoadingLeads(false);
  }, []);

  useEffect(() => {
    loadProjects();
    loadLeads();
  }, [loadProjects, loadLeads]);

  async function handleDeleteLead(lead: LeadRow) {
    if (!confirm(`Apagar o lead de "${lead.nome || lead.whatsapp}"?`)) return;
    await supabase.from("leads").delete().eq("id", lead.id);
    await loadLeads();
  }

  function set<K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!mediaFile) {
      setFormError("Selecione o arquivo de vídeo ou foto.");
      return;
    }

    setSubmitting(true);
    try {
      let fileToUpload = mediaFile;
      if (form.category === "video") {
        setCompressProgress(0);
        fileToUpload = await compressVideo(mediaFile, setCompressProgress);
        setCompressProgress(null);
      }

      const id = crypto.randomUUID();
      const mediaExt = fileToUpload.name.split(".").pop() ?? "bin";
      const mediaPath = `${id}/media.${mediaExt}`;

      const { error: mediaErr } = await supabase.storage
        .from("project-media")
        .upload(mediaPath, fileToUpload);
      if (mediaErr) throw mediaErr;

      let thumbnailPath: string | null = null;
      if (thumbFile) {
        const thumbExt = thumbFile.name.split(".").pop() ?? "jpg";
        thumbnailPath = `${id}/thumb.${thumbExt}`;
        const { error: thumbErr } = await supabase.storage
          .from("project-media")
          .upload(thumbnailPath, thumbFile);
        if (thumbErr) throw thumbErr;
      }

      const { error: insertErr } = await supabase.from("projects").insert({
        title: form.title,
        category: form.category,
        tag: form.tag,
        description: form.description,
        media_path: mediaPath,
        thumbnail_path: thumbnailPath,
      });
      if (insertErr) throw insertErr;

      setForm(emptyForm);
      setMediaFile(null);
      setThumbFile(null);
      await loadProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao enviar o projeto.");
    } finally {
      setSubmitting(false);
      setCompressProgress(null);
    }
  }

  async function handleDelete(project: ProjectRow) {
    if (!confirm(`Apagar "${project.title}"? Essa ação não pode ser desfeita.`)) return;
    const paths = [project.media_path, project.thumbnail_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("project-media").remove(paths);
    await supabase.from("projects").delete().eq("id", project.id);
    await loadProjects();
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter',sans-serif]">
      <header className="flex items-center justify-between px-6 md:px-16 py-6 border-b border-white/10">
        <div>
          <p className="text-xs tracking-[0.3em] font-semibold" style={{ color: ORANGE }}>
            SOARTS
          </p>
          <h1 className="text-xl font-extrabold">Painel de projetos</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            Ver site
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-white/60 hover:text-white transition-colors border border-white/15 rounded-full px-4 py-2"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="px-6 md:px-16 py-12 max-w-6xl mx-auto grid lg:grid-cols-[380px_1fr] gap-12">
        {/* Formulário de novo projeto */}
        <form onSubmit={handleAddProject} className="liquid-glass rounded-3xl p-6 space-y-4 h-fit">
          <h2 className="text-lg font-bold mb-2">Novo projeto</h2>

          <div className="flex gap-2">
            {(["video", "foto"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set("category", cat)}
                className="px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
                style={
                  form.category === cat
                    ? { backgroundColor: ORANGE, borderColor: ORANGE, color: "#fff" }
                    : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }
                }
              >
                {cat === "video" ? "Vídeo" : "Foto"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1">Título</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FF5200] transition-colors"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1">Categoria/tag (ex: Institucional)</label>
            <input
              type="text"
              required
              value={form.tag}
              onChange={(e) => set("tag", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FF5200] transition-colors"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1">Descrição curta</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FF5200] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1">
              {form.category === "video" ? "Arquivo de vídeo" : "Arquivo de foto"}
            </label>
            <input
              type="file"
              required
              accept={form.category === "video" ? "video/*" : "image/*"}
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
            />
          </div>

          {form.category === "video" && (
            <div>
              <label className="text-white/70 text-sm block mb-1">Capa (opcional, recomendado)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
              />
            </div>
          )}

          {compressProgress !== null && (
            <p className="text-white/50 text-xs">
              Reduzindo o vídeo antes de publicar… {Math.round(compressProgress * 100)}%
            </p>
          )}

          {formError && <p className="text-red-400 text-sm">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-bold py-3 rounded-full transition-colors disabled:opacity-50"
            style={{ backgroundColor: ORANGE }}
          >
            {compressProgress !== null
              ? "Reduzindo vídeo…"
              : submitting
                ? "Enviando…"
                : "Adicionar projeto"}
          </button>
        </form>

        {/* Lista de projetos existentes */}
        <div>
          <h2 className="text-lg font-bold mb-4">Projetos publicados</h2>
          {loadingList ? (
            <p className="text-white/40">Carregando…</p>
          ) : projects.length === 0 ? (
            <p className="text-white/40">Nenhum projeto ainda. Adicione o primeiro ao lado.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((project) => {
                const previewPath = project.thumbnail_path ?? project.media_path;
                const isVideoPreview = !project.thumbnail_path && project.category === "video";
                return (
                  <div key={project.id} className="liquid-glass rounded-2xl overflow-hidden">
                    <div className="aspect-video bg-black/40 relative">
                      {isVideoPreview ? (
                        <video src={publicMediaUrl(previewPath)} muted className="w-full h-full object-contain bg-black" />
                      ) : (
                        <img
                          src={publicMediaUrl(previewPath)}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ORANGE }}>
                          {project.tag}
                        </p>
                        <p className="font-semibold truncate">{project.title}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(project)}
                        aria-label={`Apagar ${project.title}`}
                        className="shrink-0 w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads recebidos pelo formulário de contato */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-4">
            Leads recebidos {leads.length > 0 && <span className="text-white/40 font-normal">({leads.length})</span>}
          </h2>
          {loadingLeads ? (
            <p className="text-white/40">Carregando…</p>
          ) : leads.length === 0 ? (
            <p className="text-white/40">Nenhum lead ainda. Aparecem aqui assim que alguém enviar o formulário de contato.</p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="liquid-glass rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                      <p className="font-semibold">{lead.nome || "(sem nome)"}</p>
                      {lead.empresa && <p className="text-white/50 text-sm">{lead.empresa}</p>}
                      <p className="text-white/30 text-xs">
                        {new Date(lead.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70 mb-2">
                      <a
                        href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#FF5200] transition-colors"
                        style={{ color: ORANGE }}
                      >
                        {lead.whatsapp}
                      </a>
                      {lead.instagram && <span>{lead.instagram}</span>}
                      {lead.tipo_projeto && <span>{lead.tipo_projeto}</span>}
                      {lead.investimento && <span>{lead.investimento}</span>}
                    </div>
                    {lead.mensagem && <p className="text-white/60 text-sm leading-relaxed">{lead.mensagem}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteLead(lead)}
                    aria-label={`Apagar lead de ${lead.nome || lead.whatsapp}`}
                    className="shrink-0 w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="min-h-screen bg-black" />;
  }

  return session ? <Dashboard /> : <LoginForm />;
}

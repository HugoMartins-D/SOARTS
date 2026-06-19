import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { createClient } from "@/utils/supabase/client";

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "foto";
  file_url: string;
  file_path: string;
  created_at: string;
};

type Contato = {
  id: string;
  nome: string | null;
  empresa: string | null;
  whatsapp: string;
  instagram: string;
  tipo_projeto: string;
  investimento: string;
  mensagem: string | null;
  created_at: string;
};

function ContatosTab() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("contatos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setContatos((data as Contato[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-white/30 text-sm">Carregando...</p>;
  if (contatos.length === 0) return <p className="text-white/30 text-sm">Nenhuma resposta ainda.</p>;

  return (
    <div className="space-y-3">
      {contatos.map((c) => (
        <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
          >
            <div>
              <p className="font-semibold text-sm">{c.nome || "Sem nome"} {c.empresa ? `· ${c.empresa}` : ""}</p>
              <p className="text-white/40 text-xs mt-0.5">{new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <svg className={`w-4 h-4 text-white/40 transition-transform ${expanded === c.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded === c.id && (
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-white/40 text-xs mb-0.5">WhatsApp</p>
                <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-[#ff9000] text-sm hover:underline">{c.whatsapp}</a>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">Instagram</p>
                <p className="text-sm">{c.instagram}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">Tipo de projeto</p>
                <p className="text-sm">{c.tipo_projeto}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">Investimento</p>
                <p className="text-sm">{c.investimento}</p>
              </div>
              {c.mensagem && (
                <div className="sm:col-span-2">
                  <p className="text-white/40 text-xs mb-0.5">Mensagem</p>
                  <p className="text-sm text-white/80 leading-relaxed">{c.mensagem}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [adminTab, setAdminTab] = useState<"midia" | "contatos">("midia");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"video" | "foto">("video");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    const { data } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMedia(data as MediaItem[]);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo."); return; }
    if (!title.trim()) { setError("Informe um título."); return; }

    setUploading(true);
    setError("");
    setProgress(10);

    const ext = file.name.split(".").pop();
    const path = `${type}s/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError("Erro no upload: " + uploadError.message);
      setUploading(false);
      setProgress(0);
      return;
    }

    setProgress(70);

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

    const { error: dbError } = await supabase.from("media").insert({
      title: title.trim(),
      description: description.trim() || null,
      type,
      file_url: urlData.publicUrl,
      file_path: path,
    });

    if (dbError) {
      setError("Erro ao salvar: " + dbError.message);
    } else {
      setTitle("");
      setDescription("");
      setFile(null);
      setType("video");
      if (fileRef.current) fileRef.current.value = "";
      await fetchMedia();
    }

    setProgress(100);
    setTimeout(() => { setProgress(0); setUploading(false); }, 600);
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Deletar "${item.title}"?`)) return;
    await supabase.storage.from("media").remove([item.file_path]);
    await supabase.from("media").delete().eq("id", item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter',sans-serif] px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">SOARTS Admin</h1>
            <p className="text-white/40 text-sm">Gerenciamento de conteúdo</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white text-sm border border-white/10 px-4 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-3 mb-8">
          {(["midia", "contatos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAdminTab(t)}
              className={`px-6 py-2 rounded-full font-semibold text-sm border transition-colors ${
                adminTab === t
                  ? "bg-[#ff9000] border-[#ff9000] text-white"
                  : "border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {t === "midia" ? "Mídia" : "Contatos"}
            </button>
          ))}
        </div>

        {adminTab === "contatos" ? <ContatosTab /> : null}

        {/* Upload Form */}
        {adminTab === "midia" && (<>
        <form onSubmit={handleUpload} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 space-y-4">
          <h2 className="font-bold text-lg mb-2">Novo upload</h2>

          {/* Tipo */}
          <div className="flex gap-3">
            {(["video", "foto"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                  type === t
                    ? "bg-[#ff9000] border-[#ff9000] text-white"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {t === "video" ? "Vídeo" : "Foto"}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-[#ff9000] bg-[#ff9000]/5" : "border-white/10 hover:border-white/30"
            }`}
          >
            {file ? (
              <p className="text-white/80 text-sm">{file.name}</p>
            ) : (
              <>
                <p className="text-white/50 text-sm">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-white/30 text-xs mt-1">
                  {type === "video" ? "MP4, MOV, WebM" : "JPG, PNG, WebP"}
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={type === "video" ? "video/*" : "image/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Título */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título *"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff9000] transition-colors"
          />

          {/* Descrição */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff9000] transition-colors resize-none"
          />

          {/* Progress bar */}
          {progress > 0 && (
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-[#ff9000] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-[#ff9000] text-white font-bold py-3 rounded-lg hover:bg-[#e08000] transition-colors disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "Enviar"}
          </button>
        </form>

        {/* Lista de mídia */}
        <h2 className="font-bold text-lg mb-4">Mídia enviada ({media.length})</h2>

        {media.length === 0 ? (
          <p className="text-white/30 text-sm">Nenhum arquivo ainda.</p>
        ) : (
          <div className="space-y-3">
            {media.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0">
                  {item.type === "foto" ? (
                    <img src={item.file_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#ff9000]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-white/40 text-xs capitalize">{item.type}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item)}
                  className="text-white/30 hover:text-red-400 transition-colors shrink-0"
                  title="Deletar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        </>)}
      </div>
    </div>
  );
}

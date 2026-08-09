import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { publicMediaUrl, type ProjectRow } from "@/utils/projects";
import type { LeadRow } from "@/utils/leads";
import { compressVideo } from "@/utils/compressVideo";
import { compressImage } from "@/utils/compressImage";
import { extractVideoFrame } from "@/utils/extractVideoFrame";

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
  const [extraPhotoFiles, setExtraPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [compressProgress, setCompressProgress] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingCoverId, setGeneratingCoverId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const loadProjects = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("projects")
      .select("*, project_photos(id, path, position)")
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

  function startEdit(project: ProjectRow) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      category: project.category,
      tag: project.tag,
      description: project.description,
    });
    setMediaFile(null);
    setThumbFile(null);
    setExtraPhotoFiles([]);
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMediaFile(null);
    setThumbFile(null);
    setExtraPhotoFiles([]);
    setFormError(null);
  }

  async function handleDeleteExtraPhoto(photo: { id: string; path: string }) {
    await supabase.storage.from("project-media").remove([photo.path]);
    await supabase.from("project_photos").delete().eq("id", photo.id);
    await loadProjects();
  }

  // Gera a capa de um vídeo que já está publicado, sem precisar reenviar o
  // arquivo inteiro — baixa o vídeo já hospedado, extrai um frame no
  // navegador e sobe só a imagem. Resolve os vídeos antigos que ficaram sem
  // capa antes do upload passar a gerar isso automaticamente.
  async function handleAutoGenerateCover(project: ProjectRow) {
    setGeneratingCoverId(project.id);
    setFormError(null);
    try {
      const res = await fetch(publicMediaUrl(project.media_path));
      if (!res.ok) throw new Error("Não foi possível baixar o vídeo publicado.");
      const blob = await res.blob();
      const videoFile = new File([blob], "video.mp4", { type: blob.type || "video/mp4" });

      const posterFile = await extractVideoFrame(videoFile);
      if (!posterFile) throw new Error("Não foi possível extrair um frame desse vídeo.");

      const folderId = project.media_path.split("/")[0];
      const thumbnailPath = `${folderId}/thumb.jpg`;
      const { error: thumbErr } = await supabase.storage
        .from("project-media")
        .upload(thumbnailPath, posterFile, { upsert: true });
      if (thumbErr) throw thumbErr;

      const { error: updateErr } = await supabase
        .from("projects")
        .update({ thumbnail_path: thumbnailPath })
        .eq("id", project.id);
      if (updateErr) throw updateErr;

      await loadProjects();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao gerar a capa automaticamente.",
      );
    } finally {
      setGeneratingCoverId(null);
    }
  }

  async function handleSubmitProject(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!editingId && !mediaFile) {
      setFormError("Selecione o arquivo de vídeo ou foto.");
      return;
    }

    setSubmitting(true);
    try {
      const updates: {
        title: string;
        category: "video" | "foto";
        tag: string;
        description: string;
        media_path?: string;
        thumbnail_path?: string | null;
      } = {
        title: form.title,
        category: form.category,
        tag: form.tag,
        description: form.description,
      };

      // Replacing the media file is optional while editing; the text fields
      // above can be saved on their own without touching storage at all.
      if (mediaFile) {
        let fileToUpload = mediaFile;
        let posterFile: File | null = thumbFile ? await compressImage(thumbFile) : null;

        if (form.category === "video") {
          setCompressProgress(0);
          fileToUpload = await compressVideo(mediaFile, setCompressProgress);
          setCompressProgress(null);
          // Sem capa própria, tira um frame do vídeo já comprimido — sem
          // isso o card depende do navegador buscar um frame sozinho, o que
          // é inconsistente no mobile e deixava o card preto.
          if (!posterFile) posterFile = await extractVideoFrame(fileToUpload);
        } else {
          fileToUpload = await compressImage(mediaFile);
        }

        const id = crypto.randomUUID();
        const mediaExt = fileToUpload.name.split(".").pop() ?? "bin";
        const mediaPath = `${id}/media.${mediaExt}`;

        const { error: mediaErr } = await supabase.storage
          .from("project-media")
          .upload(mediaPath, fileToUpload);
        if (mediaErr) throw mediaErr;
        updates.media_path = mediaPath;

        let thumbnailPath: string | null = null;
        if (posterFile) {
          const thumbExt = posterFile.name.split(".").pop() ?? "jpg";
          thumbnailPath = `${id}/thumb.${thumbExt}`;
          const { error: thumbErr } = await supabase.storage
            .from("project-media")
            .upload(thumbnailPath, posterFile);
          if (thumbErr) throw thumbErr;
        }
        updates.thumbnail_path = thumbnailPath;
      } else if (thumbFile && editingId) {
        // Trocar só a capa, sem reenviar o vídeo — evita comprimir de novo
        // um arquivo que já está bom, só pra atualizar a imagem de capa.
        const previous = projects.find((p) => p.id === editingId);
        const posterFile = await compressImage(thumbFile);
        const folderId = previous?.media_path?.split("/")[0] ?? crypto.randomUUID();
        const thumbExt = posterFile.name.split(".").pop() ?? "jpg";
        const thumbnailPath = `${folderId}/thumb.${thumbExt}`;
        const { error: thumbErr } = await supabase.storage
          .from("project-media")
          .upload(thumbnailPath, posterFile, { upsert: true });
        if (thumbErr) throw thumbErr;
        updates.thumbnail_path = thumbnailPath;
      }

      let projectId = editingId;

      if (editingId) {
        const previous = projects.find((p) => p.id === editingId);
        const { error: updateErr } = await supabase
          .from("projects")
          .update(updates)
          .eq("id", editingId);
        if (updateErr) throw updateErr;

        // Only clean up the old storage files once the row update above
        // succeeded, and only when they were actually replaced.
        if (updates.media_path && previous) {
          const stale = [previous.media_path, previous.thumbnail_path].filter(
            Boolean,
          ) as string[];
          if (stale.length) await supabase.storage.from("project-media").remove(stale);
        } else if (
          updates.thumbnail_path &&
          previous?.thumbnail_path &&
          previous.thumbnail_path !== updates.thumbnail_path
        ) {
          await supabase.storage.from("project-media").remove([previous.thumbnail_path]);
        }
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("projects")
          .insert(updates)
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        projectId = inserted.id;
      }

      // Fotos extras só se acumulam (nunca substituem as já existentes) —
      // apagar uma é uma ação separada, feita direto na lista abaixo.
      if (extraPhotoFiles.length && projectId) {
        const newPhotos: { project_id: string; path: string }[] = [];
        for (const rawFile of extraPhotoFiles) {
          const file = await compressImage(rawFile);
          const ext = file.name.split(".").pop() ?? "jpg";
          const path = `${crypto.randomUUID()}/photo.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("project-media")
            .upload(path, file);
          if (uploadErr) throw uploadErr;
          newPhotos.push({ project_id: projectId, path });
        }
        const { error: photosErr } = await supabase.from("project_photos").insert(newPhotos);
        if (photosErr) throw photosErr;
      }

      setForm(emptyForm);
      setMediaFile(null);
      setThumbFile(null);
      setExtraPhotoFiles([]);
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar o projeto.");
    } finally {
      setSubmitting(false);
      setCompressProgress(null);
    }
  }

  async function handleDelete(project: ProjectRow) {
    if (!confirm(`Apagar "${project.title}"? Essa ação não pode ser desfeita.`)) return;
    const extraPaths = (project.project_photos ?? []).map((p) => p.path);
    const paths = [project.media_path, project.thumbnail_path, ...extraPaths].filter(
      Boolean,
    ) as string[];
    if (paths.length) await supabase.storage.from("project-media").remove(paths);
    // As linhas de project_photos somem sozinhas (on delete cascade).
    await supabase.from("projects").delete().eq("id", project.id);
    if (editingId === project.id) cancelEdit();
    await loadProjects();
  }

  // Muda a posição de um projeto na lista, trocando de lugar com o vizinho.
  // Como todo projeto novo nasce com position=0 (empatado), renumerar a
  // lista inteira pelo índice atual evita empates e mantém tudo consistente
  // com a ordem exibida — o custo é irrelevante pro tamanho dessa lista.
  async function moveProject(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const reordered = [...projects];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setProjects(reordered);

    await Promise.all(
      reordered.map((project, i) =>
        supabase.from("projects").update({ position: i }).eq("id", project.id),
      ),
    );
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
        {/* Formulário de novo projeto / edição */}
        <form
          ref={formRef}
          onSubmit={handleSubmitProject}
          className="liquid-glass rounded-3xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">{editingId ? "Editar projeto" : "Novo projeto"}</h2>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>

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
          {editingId && (
            <p className="text-white/40 text-xs -mt-2">
              Se mudar o tipo, envie também um novo arquivo compatível abaixo.
            </p>
          )}

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
              {editingId && " (opcional — deixe em branco pra manter o atual)"}
            </label>
            <input
              type="file"
              required={!editingId}
              accept={form.category === "video" ? "video/*" : "image/*"}
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
            />
          </div>

          {form.category === "video" && (
            <div>
              <label className="text-white/70 text-sm block mb-1">
                Capa (opcional, recomendado)
                {editingId && !mediaFile && " — só é usada se você também enviar um vídeo novo"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
              />
            </div>
          )}

          {form.category === "foto" && (
            <div>
              <label className="text-white/70 text-sm block mb-1">
                Mais fotos (opcional) — além da de cima, todas entram na galeria do projeto
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setExtraPhotoFiles(Array.from(e.target.files ?? []))}
                className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
              />
              {extraPhotoFiles.length > 0 && (
                <p className="text-white/40 text-xs mt-1">
                  {extraPhotoFiles.length} foto{extraPhotoFiles.length > 1 ? "s" : ""} selecionada
                  {extraPhotoFiles.length > 1 ? "s" : ""}
                </p>
              )}

              {editingId &&
                (() => {
                  const current = projects.find((p) => p.id === editingId)?.project_photos ?? [];
                  if (!current.length) return null;
                  return (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {current.map((photo) => (
                        <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                          <img
                            src={publicMediaUrl(photo.path)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteExtraPhoto(photo)}
                            aria-label="Remover esta foto"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                ? "Salvando…"
                : editingId
                  ? "Salvar alterações"
                  : "Adicionar projeto"}
          </button>
        </form>

        {/* Lista de projetos existentes */}
        <div>
          <h2 className="text-lg font-bold mb-1">Projetos publicados</h2>
          {projects.length > 1 && (
            <p className="text-white/40 text-xs mb-4">
              Use as setas para definir a ordem em que aparecem no site.
            </p>
          )}
          {loadingList ? (
            <p className="text-white/40">Carregando…</p>
          ) : projects.length === 0 ? (
            <p className="text-white/40">Nenhum projeto ainda. Adicione o primeiro ao lado.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project, index) => {
                const previewPath = project.thumbnail_path ?? project.media_path;
                const isVideoPreview = !project.thumbnail_path && project.category === "video";
                return (
                  <div
                    key={project.id}
                    className="liquid-glass rounded-2xl p-3 flex items-center gap-3"
                    style={editingId === project.id ? { boxShadow: `0 0 0 2px ${ORANGE}` } : undefined}
                  >
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveProject(index, -1)}
                        disabled={index === 0}
                        aria-label={`Mover ${project.title} para cima`}
                        className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveProject(index, 1)}
                        disabled={index === projects.length - 1}
                        aria-label={`Mover ${project.title} para baixo`}
                        className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black/40 shrink-0">
                      {isVideoPreview ? (
                        <video src={publicMediaUrl(previewPath)} muted className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src={publicMediaUrl(previewPath)}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ORANGE }}>
                        {project.tag}
                      </p>
                      <p className="font-semibold truncate">
                        {project.title}
                        {project.project_photos && project.project_photos.length > 0 && (
                          <span className="text-white/40 font-normal text-sm">
                            {" "}
                            (+{project.project_photos.length} foto
                            {project.project_photos.length > 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                      {project.category === "video" && !project.thumbnail_path && (
                        <button
                          type="button"
                          onClick={() => handleAutoGenerateCover(project)}
                          disabled={generatingCoverId === project.id}
                          className="text-xs mt-1 hover:underline disabled:opacity-50 disabled:pointer-events-none"
                          style={{ color: ORANGE }}
                        >
                          {generatingCoverId === project.id
                            ? "Gerando capa…"
                            : "Sem capa — gerar automaticamente"}
                        </button>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => startEdit(project)}
                        aria-label={`Editar ${project.title}`}
                        className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        aria-label={`Apagar ${project.title}`}
                        className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/40 transition-colors"
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

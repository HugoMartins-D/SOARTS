const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type ProjectPhotoRow = {
  id: string;
  project_id: string;
  path: string;
  position: number;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  title: string;
  category: "video" | "foto";
  tag: string;
  description: string;
  media_path: string;
  thumbnail_path: string | null;
  position: number;
  created_at: string;
  // Fotos além da capa (`media_path`), presente só em projetos de foto.
  // Embutido via PostgREST a partir da FK de project_photos -> projects.
  project_photos?: Pick<ProjectPhotoRow, "id" | "path" | "position">[];
};

export function publicMediaUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/project-media/${path}`;
}

/**
 * Leitura pública via REST puro (PostgREST), sem passar por
 * @supabase/supabase-js — o SDK completo carrega auth/storage/realtime
 * juntos e pesa ~200KB só pra fazer um SELECT. Isso fica reservado pro
 * /admin, que já é lazy-loaded; a Home usa só fetch nativo.
 */
export async function fetchPublicProjects(): Promise<ProjectRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?select=*,project_photos(path,position)&order=position.asc,created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    },
  );
  if (!res.ok) return [];
  return res.json();
}

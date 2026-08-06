import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// SDK completo (auth + upload de storage) — usado só pelo /admin, que é
// lazy-loaded. Leitura pública dos projetos vive em `@/utils/projects`,
// via fetch puro, pra não pesar o bundle da Home.
export const supabase = createClient(url, anonKey);

export { type ProjectRow, publicMediaUrl } from "./projects";

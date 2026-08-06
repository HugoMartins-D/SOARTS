const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type LeadRow = {
  id: string;
  nome: string | null;
  empresa: string | null;
  whatsapp: string;
  instagram: string | null;
  tipo_projeto: string | null;
  investimento: string | null;
  mensagem: string | null;
  created_at: string;
};

export type NewLead = {
  nome: string;
  empresa: string;
  whatsapp: string;
  instagram: string;
  tipo_projeto: string;
  investimento: string;
  mensagem: string;
};

/**
 * Grava o lead do formulário de contato via REST puro (mesmo motivo do
 * `fetchPublicProjects`: a Home não deveria baixar o SDK completo do
 * Supabase só pra um INSERT). Falha em silêncio de propósito — perder o
 * registro no banco não pode travar o envio pelo WhatsApp, que é o
 * caminho principal.
 */
export async function submitLead(lead: NewLead): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
    });
  } catch {
    // Sem tela de erro pro usuário — o WhatsApp já abriu, que é o que importa.
  }
}

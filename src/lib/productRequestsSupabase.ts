import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegistrationCartSnapshot } from "@/lib/registrationInterest";

export type ProductRequestRow = {
  id: string;
  client_id: string;
  profile_id: string | null;
  items: RegistrationCartSnapshot["items"];
  created_at: string;
};

export async function createProductRequest(
  sb: SupabaseClient,
  args: { clientId: string; profileId: string; items: RegistrationCartSnapshot["items"] },
) {
  const { error } = await sb.from("product_requests").insert({
    client_id: args.clientId,
    profile_id: args.profileId,
    items: args.items,
  });
  if (error) throw error;
}

export async function fetchProductRequests(
  sb: SupabaseClient,
): Promise<
  Array<{
    request: ProductRequestRow;
    client: {
      id: string;
      nome: string | null;
      cpf: string | null;
      email: string | null;
      telefone: string | null;
    } | null;
  }>
> {
  const { data, error } = await sb
    .from("product_requests")
    .select("id, client_id, profile_id, items, created_at, clients(id, nome, cpf, email, telefone)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    request: {
      id: row.id,
      client_id: row.client_id,
      profile_id: row.profile_id,
      items: Array.isArray(row.items) ? row.items : [],
      created_at: row.created_at,
    },
    client: row.clients
      ? {
          id: row.clients.id,
          nome: row.clients.nome ?? null,
          cpf: row.clients.cpf ?? null,
          email: row.clients.email ?? null,
          telefone: row.clients.telefone ?? null,
        }
      : null,
  }));
}


/** Linha da tabela public.profiles (cadastro + Auth). */
export type ProfileRow = {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  estado_civil: string;
  instagram: string;
  contato1: string;
  contato2: string;
  endereco_residencial: string;
  endereco_trabalho: string;
  salario: string;
  dependentes: string;
  tipo_moradia: string;
  outras_rendas: string;
  interest_type: "emprestimo" | "produto" | "ambos";
  interest_cart: unknown | null;
  doc_rg_path: string | null;
  doc_selfie_path: string | null;
  doc_comprovante_path: string | null;
  doc_holerite_path: string | null;
  doc_ctps_path: string | null;
  doc_extrato_path: string | null;
  registration_status: "pending" | "approved" | "rejected";
  linked_client_id: string | null;
  created_at: string;
};

import type { ContractStatus } from "@/lib/contractStatus";

export interface Parcela {
  numero: number;
  total: number;
  valor: number;
  vencimento: string;
  status: "pago" | "pendente" | "atrasado";
  /** URL pública, data URL (modo local) ou link assinado — usada na área do cliente */
  boletoUrl?: string | null;
  /** Caminho no bucket Supabase Storage (modo nuvem) */
  boletoPath?: string | null;
  /** Código copiável do boleto (linha digitável) */
  boletoCode?: string | null;
  /** Código copiável do Pix (copia e cola) */
  pixCode?: string | null;
}

/** Dados do produto vendido no contrato (documentos PDF). */
export type ContractProductFields = {
  produtoCategoria: string;
  produtoModelo: string;
  produtoCor: string;
  produtoSerie: string;
  produtoImei: string;
  produtoEstado: string;
  produtoAcessorios: string;
};

export const emptyContractProductFields = (): ContractProductFields => ({
  produtoCategoria: "",
  produtoModelo: "",
  produtoCor: "",
  produtoSerie: "",
  produtoImei: "",
  produtoEstado: "",
  produtoAcessorios: "",
});

export interface Contrato extends ContractProductFields {
  id: string;
  numero: string;
  valor: number;
  parcelas: number;
  valorParcela: number;
  status: ContractStatus;
  listaParcelas: Parcela[];
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  profissao: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  instagram: string;
  contato1: string;
  contato2: string;
  enderecoResidencial: string;
  enderecoTrabalho: string;
  salario: string;
  dependentes: string;
  tipoMoradia: string;
  outrasRendas: string;
  situacao: "regular" | "irregular";
  statusContrato: "ativo" | "em_andamento" | "sem_contrato" | "finalizado";
  contratos: Contrato[];
}

export interface CadastroPendente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  instagram: string;
  contato1: string;
  contato2: string;
  enderecoResidencial: string;
  enderecoTrabalho: string;
  salario: string;
  dependentes: string;
  tipoMoradia: string;
  outrasRendas: string;
  dataCadastro: string;
}

export const mockParcelas1: Parcela[] = [
  { numero: 1, total: 5, valor: 540, vencimento: "10/02/2026", status: "pago" },
  { numero: 2, total: 5, valor: 540, vencimento: "10/03/2026", status: "pago" },
  { numero: 3, total: 5, valor: 540, vencimento: "10/04/2026", status: "pendente" },
  { numero: 4, total: 5, valor: 540, vencimento: "10/05/2026", status: "pendente" },
  { numero: 5, total: 5, valor: 540, vencimento: "10/06/2026", status: "pendente" },
];

export const mockParcelas2: Parcela[] = [
  { numero: 1, total: 4, valor: 375, vencimento: "05/01/2026", status: "pago" },
  { numero: 2, total: 4, valor: 375, vencimento: "05/02/2026", status: "pago" },
  { numero: 3, total: 4, valor: 375, vencimento: "05/03/2026", status: "atrasado" },
  { numero: 4, total: 4, valor: 375, vencimento: "05/04/2026", status: "pendente" },
];

export const mockClientes: Cliente[] = [
  {
    id: "1",
    nome: "João Silva",
    cpf: "123.456.789-00",
    rg: "",
    profissao: "",
    dataNascimento: "",
    email: "joao@email.com",
    telefone: "(11) 99999-1234",
    estadoCivil: "Solteiro",
    instagram: "@joaosilva",
    contato1: "Maria Silva - (11) 98888-0001",
    contato2: "Pedro Santos - (11) 98888-0002",
    enderecoResidencial: "Rua das Flores, 123 - Centro, São Paulo/SP",
    enderecoTrabalho: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
    salario: "R$ 3.500,00",
    dependentes: "1",
    tipoMoradia: "Aluguel",
    outrasRendas: "R$ 500,00 (freelancer)",
    situacao: "regular",
    statusContrato: "ativo",
    contratos: [
      {
        id: "c1",
        numero: "#395-2025",
        valor: 2700,
        parcelas: 5,
        valorParcela: 540,
        status: "ativo",
        ...emptyContractProductFields(),
        listaParcelas: mockParcelas1,
      },
    ],
  },
  {
    id: "2",
    nome: "Maria Souza",
    cpf: "987.654.321-00",
    rg: "",
    profissao: "",
    dataNascimento: "",
    email: "maria@email.com",
    telefone: "(21) 98888-5678",
    estadoCivil: "Casada",
    instagram: "@mariasouza",
    contato1: "Ana Souza - (21) 97777-0001",
    contato2: "Carlos Lima - (21) 97777-0002",
    enderecoResidencial: "Rua do Sol, 456 - Copacabana, Rio de Janeiro/RJ",
    enderecoTrabalho: "Av. Rio Branco, 200 - Centro, Rio de Janeiro/RJ",
    salario: "R$ 2.800,00",
    dependentes: "2",
    tipoMoradia: "Própria",
    outrasRendas: "",
    situacao: "regular",
    statusContrato: "ativo",
    contratos: [
      {
        id: "c2",
        numero: "#005-2026",
        valor: 1500,
        parcelas: 4,
        valorParcela: 375,
        status: "ativo",
        ...emptyContractProductFields(),
        listaParcelas: mockParcelas2,
      },
    ],
  },
  {
    id: "3",
    nome: "Carlos Oliveira",
    cpf: "456.789.123-00",
    rg: "",
    profissao: "",
    dataNascimento: "",
    email: "carlos@email.com",
    telefone: "(31) 97777-9012",
    estadoCivil: "Divorciado",
    instagram: "",
    contato1: "Lucia Oliveira - (31) 96666-0001",
    contato2: "Roberto Alves - (31) 96666-0002",
    enderecoResidencial: "Rua Minas Gerais, 789 - Savassi, Belo Horizonte/MG",
    enderecoTrabalho: "Av. Afonso Pena, 500 - Centro, Belo Horizonte/MG",
    salario: "R$ 4.200,00",
    dependentes: "0",
    tipoMoradia: "Aluguel",
    outrasRendas: "R$ 1.000,00 (Uber)",
    situacao: "regular",
    statusContrato: "sem_contrato",
    contratos: [],
  },
  {
    id: "4",
    nome: "Ana Paula Costa",
    cpf: "321.654.987-00",
    rg: "",
    profissao: "",
    dataNascimento: "",
    email: "anapaula@email.com",
    telefone: "(41) 96666-3456",
    estadoCivil: "Solteira",
    instagram: "@anacosta",
    contato1: "Fernanda Costa - (41) 95555-0001",
    contato2: "Ricardo Pereira - (41) 95555-0002",
    enderecoResidencial: "Rua XV de Novembro, 321 - Centro, Curitiba/PR",
    enderecoTrabalho: "Av. Sete de Setembro, 800 - Centro, Curitiba/PR",
    salario: "R$ 2.200,00",
    dependentes: "3",
    tipoMoradia: "Financiada",
    outrasRendas: "",
    situacao: "regular",
    statusContrato: "finalizado",
    contratos: [
      {
        id: "c3",
        numero: "#210-2025",
        valor: 1800,
        parcelas: 3,
        valorParcela: 600,
        status: "finalizado",
        ...emptyContractProductFields(),
        listaParcelas: [
          { numero: 1, total: 3, valor: 600, vencimento: "15/08/2025", status: "pago" },
          { numero: 2, total: 3, valor: 600, vencimento: "15/09/2025", status: "pago" },
          { numero: 3, total: 3, valor: 600, vencimento: "15/10/2025", status: "pago" },
        ],
      },
    ],
  },
];

export const mockCadastrosPendentes: CadastroPendente[] = [
  {
    id: "p1",
    nome: "Roberto Almeida",
    cpf: "111.222.333-44",
    email: "roberto@email.com",
    telefone: "(11) 94444-1111",
    estadoCivil: "Casado",
    instagram: "@robertoalm",
    contato1: "Sandra Almeida - (11) 93333-0001",
    contato2: "Marcos Vieira - (11) 93333-0002",
    enderecoResidencial: "Rua Augusta, 500 - Consolação, São Paulo/SP",
    enderecoTrabalho: "Av. Faria Lima, 1200 - Pinheiros, São Paulo/SP",
    salario: "R$ 5.000,00",
    dependentes: "2",
    tipoMoradia: "Aluguel",
    outrasRendas: "R$ 800,00",
    dataCadastro: "18/03/2026",
  },
  {
    id: "p2",
    nome: "Fernanda Lima",
    cpf: "555.666.777-88",
    email: "fernanda@email.com",
    telefone: "(21) 93333-2222",
    estadoCivil: "Solteira",
    instagram: "",
    contato1: "Juliana Lima - (21) 92222-0001",
    contato2: "Thiago Ramos - (21) 92222-0002",
    enderecoResidencial: "Rua Barata Ribeiro, 200 - Copacabana, Rio de Janeiro/RJ",
    enderecoTrabalho: "Av. Presidente Vargas, 600 - Centro, Rio de Janeiro/RJ",
    salario: "R$ 3.000,00",
    dependentes: "1",
    tipoMoradia: "Própria",
    outrasRendas: "",
    dataCadastro: "20/03/2026",
  },
];

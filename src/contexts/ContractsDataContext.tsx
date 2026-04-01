import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Cliente, Contrato, Parcela } from "@/data/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  loadClientesFromLocalStorage,
  saveClientesToLocalStorage,
} from "@/lib/contractsLocalStorage";
import { isContractNumeroTaken, resolveContractNumero } from "@/lib/contractNumero";
import {
  buildClienteFromManualFields,
  ensureSupabaseSeed,
  fetchClientesFromSupabase,
  mergeManualFieldsIntoCliente,
  type ManualClienteFields,
  supabaseCreateClientManual,
  supabaseCreateClienteWithPortalAuth,
  supabaseCreateContractWithInstallments,
  supabaseDeleteClient,
  supabaseDeleteContract,
  supabaseFinalizeContract,
  supabaseSendClientPasswordReset,
  supabaseUpdateContractStatus,
  supabaseUpdateContractNumero,
  supabaseUpdateClientManualFields,
  supabaseUpdateClientManualStatus,
  supabaseUpdateInstallmentStatus,
  supabaseUploadInstallmentBoleto,
} from "@/lib/contractsSupabase";
import { validatePortalPassword } from "@/lib/clientPasswordPolicy";
import { deriveClienteStatus } from "@/lib/deriveClienteStatus";
import {
  buildParcelaDueDates,
  formatVencimentoBR,
  formatIsoToBR,
  splitTotalAcrossInstallments,
} from "@/lib/parcelSchedule";
import type { ContractStatus } from "@/lib/contractStatus";

const MAX_LOCAL_FILE_BYTES = 2 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export type CreateContractInput = {
  /** Texto livre (ex.: 395-2025); vazio gera código automático. */
  numeroPersonalizado: string;
  valorTotal: number;
  parcelasCount: number;
  diaVencimento: number;
  primeiroVencimentoYm: string;
  arquivosPorParcela: (File | null | undefined)[];
  status: ContractStatus;
  /** Se preenchido, sobrescreve o vencimento (automático) de cada parcela por ISO yyyy-MM-dd. */
  vencimentosPorParcelaIso?: string[];
};

type DataSource = "supabase" | "local";

type ContractsContextValue = {
  clientes: Cliente[];
  ready: boolean;
  loading: boolean;
  dataSource: DataSource | null;
  reload: () => Promise<void>;
  createContractForCliente: (
    clientId: string,
    input: CreateContractInput,
  ) => Promise<void>;
  updateParcelaStatus: (
    clientId: string,
    contractId: string,
    parcelaNumero: number,
    status: Parcela["status"],
  ) => Promise<void>;
  uploadParcelaBoleto: (
    clientId: string,
    contractId: string,
    parcelaNumero: number,
    file: File,
  ) => Promise<void>;
  finalizeContract: (clientId: string, contractId: string) => Promise<void>;
  updateContractStatus: (
    clientId: string,
    contractId: string,
    status: ContractStatus,
  ) => Promise<void>;
  renameContractNumero: (
    clientId: string,
    contractId: string,
    rawNumero: string,
  ) => Promise<boolean>;
  deleteContract: (clientId: string, contractId: string) => Promise<boolean>;
  /**
   * Cria cliente manual (só nome obrigatório).
   * Com `portalPassword`, cria também Auth + perfil aprovado (exige e-mail válido).
   */
  createClienteManual: (
    fields: ManualClienteFields,
    options?: { portalPassword?: string },
  ) => Promise<string | null>;
  deleteCliente: (clientId: string) => Promise<boolean>;
  getClienteById: (id: string) => Cliente | undefined;
  /** Atualiza campos da ficha (admin); preserva contratos e situação. */
  updateClienteManualFields: (
    clientId: string,
    fields: ManualClienteFields,
  ) => Promise<boolean>;
  setClienteSituacao: (clientId: string, situacao: Cliente["situacao"]) => Promise<void>;
  sendClientePasswordReset: (clientId: string) => Promise<void>;
};

const ContractsDataContext = createContext<ContractsContextValue | null>(null);

export function ContractsDataProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await ensureSupabaseSeed(supabase);
        const data = await fetchClientesFromSupabase(supabase);
        setClientes(data);
        setDataSource("supabase");
      } else {
        setClientes(loadClientesFromLocalStorage());
        setDataSource("local");
      }
    } catch (e) {
      console.error(e);
      toast.error(
        "Não foi possível carregar dados do Supabase. Usando armazenamento local.",
      );
      setClientes(loadClientesFromLocalStorage());
      setDataSource("local");
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const persistLocal = useCallback((next: Cliente[]) => {
    if (dataSource === "local") {
      saveClientesToLocalStorage(next);
    }
  }, [dataSource]);

  const getClienteById = useCallback(
    (id: string) => clientes.find((c) => c.id === id),
    [clientes],
  );

  const createContractForCliente = useCallback(
    async (clientId: string, input: CreateContractInput) => {
      const client = clientes.find((c) => c.id === clientId);
      if (!client) {
        toast.error("Cliente não encontrado.");
        return;
      }
      if (input.valorTotal <= 0 || input.parcelasCount < 1) {
        toast.error("Informe valor e quantidade de parcelas válidos.");
        return;
      }
      if (input.diaVencimento < 1 || input.diaVencimento > 31) {
        toast.error("Dia de vencimento deve ser entre 1 e 31.");
        return;
      }

      const valores = splitTotalAcrossInstallments(
        input.valorTotal,
        input.parcelasCount,
      );
      const dates = buildParcelaDueDates(
        input.primeiroVencimentoYm,
        input.parcelasCount,
        input.diaVencimento,
      );
      const listaParcelas: Parcela[] = dates.map((d, i) => ({
        numero: i + 1,
        total: input.parcelasCount,
        valor: valores[i],
        vencimento: input.vencimentosPorParcelaIso?.[i]
          ? formatIsoToBR(input.vencimentosPorParcelaIso[i]!)
          : formatVencimentoBR(d),
        status: "pendente",
        boletoUrl: null,
        boletoPath: null,
      }));

      const contractId = crypto.randomUUID();
      const year = new Date().getFullYear();
      const autoNumero = `#${contractId.slice(0, 6).toUpperCase()}-${year}`;
      const numero = resolveContractNumero(
        input.numeroPersonalizado,
        autoNumero,
      );
      if (isContractNumeroTaken(client, numero)) {
        toast.error("Já existe um contrato com essa identificação neste cliente.");
        return;
      }
      const valorParcela =
        Math.round((input.valorTotal / input.parcelasCount) * 100) / 100;

      const newContrato: Contrato = {
        id: contractId,
        numero,
        valor: Math.round(input.valorTotal * 100) / 100,
        parcelas: input.parcelasCount,
        valorParcela,
        status: input.status,
        listaParcelas,
      };

      const filesByNum = new Map<number, File>();
      input.arquivosPorParcela.forEach((f, idx) => {
        if (f) filesByNum.set(idx + 1, f);
      });

      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseCreateContractWithInstallments(
            supabase,
            clientId,
            newContrato,
            listaParcelas,
            filesByNum,
          );
          await reload();
        } else {
          const updatedParcelas = [...listaParcelas];
          for (const [num, file] of filesByNum) {
            if (file.size > MAX_LOCAL_FILE_BYTES) {
              toast.error(
                `Arquivo da parcela ${num} excede 2MB (modo local).`,
              );
              return;
            }
            const dataUrl = await fileToDataUrl(file);
            const pi = updatedParcelas.findIndex((p) => p.numero === num);
            if (pi >= 0) {
              updatedParcelas[pi] = { ...updatedParcelas[pi], boletoUrl: dataUrl };
            }
          }

          const contratoFinal = {
            ...newContrato,
            listaParcelas: updatedParcelas,
          };
          const nextClientes = clientes.map((c) => {
            if (c.id !== clientId) return c;
            const contratos = [...c.contratos, contratoFinal];
            return {
              ...c,
              contratos,
              statusContrato: deriveClienteStatus(contratos),
            };
          });
          setClientes(nextClientes);
          saveClientesToLocalStorage(nextClientes);
        }
        toast.success("Contrato criado com sucesso.");
      } catch (e) {
        console.error(e);
        toast.error("Falha ao criar contrato.");
      }
    },
    [clientes, dataSource, reload],
  );

  const updateParcelaStatus = useCallback(
    async (
      clientId: string,
      contractId: string,
      parcelaNumero: number,
      status: Parcela["status"],
    ) => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseUpdateInstallmentStatus(
            supabase,
            contractId,
            parcelaNumero,
            status,
          );
          await reload();
        } else {
          const next = clientes.map((c) => {
            if (c.id !== clientId) return c;
            return {
              ...c,
              contratos: c.contratos.map((k) => {
                if (k.id !== contractId) return k;
                return {
                  ...k,
                  listaParcelas: k.listaParcelas.map((p) =>
                    p.numero === parcelaNumero ? { ...p, status } : p,
                  ),
                };
              }),
            };
          });
          setClientes(next);
          persistLocal(next);
        }
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível atualizar a parcela.");
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const uploadParcelaBoleto = useCallback(
    async (
      clientId: string,
      contractId: string,
      parcelaNumero: number,
      file: File,
    ) => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseUploadInstallmentBoleto(
            supabase,
            clientId,
            contractId,
            parcelaNumero,
            file,
          );
          await reload();
        } else {
          if (file.size > MAX_LOCAL_FILE_BYTES) {
            toast.error(
              "Arquivo muito grande para o modo local (máx. 2MB). Configure o Supabase.",
            );
            return;
          }
          const dataUrl = await fileToDataUrl(file);
          const next = clientes.map((c) => {
            if (c.id !== clientId) return c;
            return {
              ...c,
              contratos: c.contratos.map((k) => {
                if (k.id !== contractId) return k;
                return {
                  ...k,
                  listaParcelas: k.listaParcelas.map((p) =>
                    p.numero === parcelaNumero
                      ? { ...p, boletoUrl: dataUrl }
                      : p,
                  ),
                };
              }),
            };
          });
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Boleto anexado.");
      } catch (e) {
        console.error(e);
        toast.error("Falha ao enviar o boleto.");
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const finalizeContract = useCallback(
    async (clientId: string, contractId: string) => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseFinalizeContract(supabase, clientId, contractId);
          await reload();
        } else {
          const next = clientes.map((c) => {
            if (c.id !== clientId) return c;
            const contratos = c.contratos.map((k) =>
              k.id === contractId ? { ...k, status: "finalizado" as const } : k,
            );
            return {
              ...c,
              contratos,
              statusContrato: deriveClienteStatus(contratos),
            };
          });
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Contrato finalizado.");
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível finalizar o contrato.");
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const updateContractStatus = useCallback(
    async (clientId: string, contractId: string, status: ContractStatus) => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseUpdateContractStatus(supabase, contractId, status);
          await reload();
        } else {
          const next = clientes.map((c) => {
            if (c.id !== clientId) return c;
            const contratos = c.contratos.map((k) =>
              k.id === contractId ? { ...k, status } : k,
            );
            return {
              ...c,
              contratos,
              statusContrato: deriveClienteStatus(contratos),
            };
          });
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Status do contrato atualizado.");
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível atualizar o status do contrato.");
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const renameContractNumero = useCallback(
    async (
      clientId: string,
      contractId: string,
      rawNumero: string,
    ): Promise<boolean> => {
      const client = clientes.find((c) => c.id === clientId);
      if (!client) {
        toast.error("Cliente não encontrado.");
        return false;
      }
      const atual = client.contratos.find((c) => c.id === contractId)?.numero;
      if (!atual) {
        toast.error("Contrato não encontrado.");
        return false;
      }
      if (!rawNumero.trim()) {
        toast.error("Informe a identificação do contrato.");
        return false;
      }
      const novo = resolveContractNumero(rawNumero, atual);
      if (novo.toLowerCase() === atual.toLowerCase()) {
        return true;
      }
      if (isContractNumeroTaken(client, novo, contractId)) {
        toast.error("Já existe um contrato com essa identificação neste cliente.");
        return false;
      }
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseUpdateContractNumero(supabase, contractId, novo);
          await reload();
        } else {
          const next = clientes.map((c) => {
            if (c.id !== clientId) return c;
            return {
              ...c,
              contratos: c.contratos.map((k) =>
                k.id === contractId ? { ...k, numero: novo } : k,
              ),
            };
          });
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Identificação do contrato atualizada.");
        return true;
      } catch (e) {
        console.error(e);
        toast.error("Falha ao atualizar identificação.");
        return false;
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const createClienteManual = useCallback(
    async (
      fields: ManualClienteFields,
      options?: { portalPassword?: string },
    ): Promise<string | null> => {
      const nome = fields.nome.trim();
      if (!nome) {
        toast.error("Informe o nome do cliente.");
        return null;
      }
      const portalPw = options?.portalPassword ?? "";
      const wantsPortal = portalPw.length > 0;

      const emailTrim = (fields.email ?? "").trim();
      if (
        emailTrim &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim.toLowerCase())
      ) {
        toast.error("E-mail inválido.");
        return null;
      }

      if (wantsPortal) {
        if (!emailTrim) {
          toast.error("Informe o e-mail do cliente para criar o acesso à conta.");
          return null;
        }
        const pwErr = validatePortalPassword(portalPw);
        if (pwErr) {
          toast.error(pwErr);
          return null;
        }
        if (dataSource !== "supabase" || !supabase) {
          toast.error(
            "Conta do cliente no login só é criada com Supabase configurado.",
          );
          return null;
        }
      }

      try {
        if (dataSource === "supabase" && supabase) {
          let id: string;
          if (wantsPortal) {
            id = await supabaseCreateClienteWithPortalAuth(
              supabase,
              fields,
              portalPw,
            );
            toast.success("Cliente criado com acesso à área do cliente.");
          } else {
            id = await supabaseCreateClientManual(supabase, fields);
            toast.success("Cliente criado.");
          }
          await reload();
          return id;
        }
        const id = crypto.randomUUID();
        const newCliente = buildClienteFromManualFields(id, fields);
        const next = [...clientes, newCliente];
        setClientes(next);
        persistLocal(next);
        toast.success("Cliente criado.");
        return id;
      } catch (e) {
        console.error(e);
        const msg =
          e instanceof Error
            ? e.message
            : "Não foi possível criar o cliente.";
        toast.error(msg);
        return null;
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const deleteContract = useCallback(
    async (clientId: string, contractId: string): Promise<boolean> => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseDeleteContract(supabase, clientId, contractId);
          await reload();
        } else {
          const next = clientes.map((c) => {
            if (c.id !== clientId) return c;
            const contratos = c.contratos.filter((k) => k.id !== contractId);
            return {
              ...c,
              contratos,
              statusContrato: deriveClienteStatus(contratos),
            };
          });
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Contrato excluído permanentemente.");
        return true;
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível excluir o contrato.");
        return false;
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const deleteCliente = useCallback(
    async (clientId: string): Promise<boolean> => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseDeleteClient(supabase, clientId);
          await reload();
        } else {
          const next = clientes.filter((c) => c.id !== clientId);
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Cliente excluído do sistema.");
        return true;
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível excluir o cliente.");
        return false;
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const updateClienteManualFields = useCallback(
    async (clientId: string, fields: ManualClienteFields) => {
      const client = clientes.find((c) => c.id === clientId);
      if (!client) {
        toast.error("Cliente não encontrado.");
        return false;
      }
      const nome = (fields.nome ?? "").trim();
      if (!nome) {
        toast.error("Informe o nome do cliente.");
        return false;
      }
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseUpdateClientManualFields(supabase, clientId, fields);
          await reload();
        } else {
          const next = clientes.map((c) =>
            c.id === clientId ? mergeManualFieldsIntoCliente(c, fields) : c,
          );
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Dados do cliente salvos.");
        return true;
      } catch (e) {
        console.error(e);
        const msg =
          e instanceof Error
            ? e.message
            : "Não foi possível salvar os dados do cliente.";
        toast.error(msg);
        return false;
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const setClienteSituacao = useCallback(
    async (clientId: string, situacao: Cliente["situacao"]) => {
      try {
        if (dataSource === "supabase" && supabase) {
          await supabaseUpdateClientManualStatus(supabase, clientId, situacao);
          await reload();
        } else {
          const next = clientes.map((c) => (c.id === clientId ? { ...c, situacao } : c));
          setClientes(next);
          persistLocal(next);
        }
        toast.success("Situação do cliente atualizada.");
      } catch (e) {
        console.error(e);
        const msg =
          e instanceof Error
            ? e.message
            : "Não foi possível atualizar a situação do cliente.";
        toast.error(msg);
      }
    },
    [clientes, dataSource, persistLocal, reload],
  );

  const sendClientePasswordReset = useCallback(
    async (clientId: string) => {
      const client = clientes.find((c) => c.id === clientId);
      if (!client) {
        toast.error("Cliente não encontrado.");
        return;
      }
      const email = (client.email ?? "").trim().toLowerCase();
      if (!email) {
        toast.error("Cliente sem e-mail cadastrado.");
        return;
      }
      if (!isSupabaseConfigured || !supabase || dataSource !== "supabase") {
        toast.error("Redefinição disponível apenas com Supabase configurado.");
        return;
      }
      try {
        await supabaseSendClientPasswordReset(supabase, email);
        toast.success("E-mail de redefinição enviado para o cliente.");
      } catch (e) {
        console.error(e);
        const msg =
          e instanceof Error ? e.message : "Não foi possível enviar redefinição.";
        toast.error(msg);
      }
    },
    [clientes, dataSource],
  );

  const value = useMemo(
    () => ({
      clientes,
      ready,
      loading,
      dataSource,
      reload,
      createContractForCliente,
      updateParcelaStatus,
      uploadParcelaBoleto,
      finalizeContract,
      updateContractStatus,
      renameContractNumero,
      deleteContract,
      deleteCliente,
      createClienteManual,
      getClienteById,
      updateClienteManualFields,
      setClienteSituacao,
      sendClientePasswordReset,
    }),
    [
      clientes,
      ready,
      loading,
      dataSource,
      reload,
      createContractForCliente,
      updateParcelaStatus,
      uploadParcelaBoleto,
      finalizeContract,
      updateContractStatus,
      renameContractNumero,
      deleteContract,
      deleteCliente,
      createClienteManual,
      getClienteById,
      updateClienteManualFields,
      setClienteSituacao,
      sendClientePasswordReset,
    ],
  );

  return (
    <ContractsDataContext.Provider value={value}>
      {children}
    </ContractsDataContext.Provider>
  );
}

export function useContractsData() {
  const ctx = useContext(ContractsDataContext);
  if (!ctx) {
    throw new Error("useContractsData must be used within ContractsDataProvider");
  }
  return ctx;
}

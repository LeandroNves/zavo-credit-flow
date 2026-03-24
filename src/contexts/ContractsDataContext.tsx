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
import {
  ensureSupabaseSeed,
  fetchClientesFromSupabase,
  supabaseCreateContractWithInstallments,
  supabaseFinalizeContract,
  supabaseUpdateInstallmentStatus,
  supabaseUploadInstallmentBoleto,
} from "@/lib/contractsSupabase";
import { deriveClienteStatus } from "@/lib/deriveClienteStatus";
import {
  buildParcelaDueDates,
  formatVencimentoBR,
  splitTotalAcrossInstallments,
} from "@/lib/parcelSchedule";

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
  valorTotal: number;
  parcelasCount: number;
  diaVencimento: number;
  primeiroVencimentoYm: string;
  arquivosPorParcela: (File | null | undefined)[];
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
  getClienteById: (id: string) => Cliente | undefined;
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
        vencimento: formatVencimentoBR(d),
        status: "pendente",
        boletoUrl: null,
        boletoPath: null,
      }));

      const contractId = crypto.randomUUID();
      const year = new Date().getFullYear();
      const numero = `#${contractId.slice(0, 6).toUpperCase()}-${year}`;
      const valorParcela =
        Math.round((input.valorTotal / input.parcelasCount) * 100) / 100;

      const newContrato: Contrato = {
        id: contractId,
        numero,
        valor: Math.round(input.valorTotal * 100) / 100,
        parcelas: input.parcelasCount,
        valorParcela,
        status: "ativo",
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
      getClienteById,
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
      getClienteById,
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

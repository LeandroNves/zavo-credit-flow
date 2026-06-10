import type { Cliente } from "@/data/mockData";
import { mockClientes } from "@/data/mockData";

const STORAGE_KEY = "zavo_clientes_v1";

function deepCloneClientes(list: Cliente[]): Cliente[] {
  return JSON.parse(JSON.stringify(list)) as Cliente[];
}

function hydrateCliente(c: Cliente): Cliente {
  return {
    ...c,
    contratos: (c.contratos ?? []).map((k) => ({
      ...k,
      paymentLinks: k.paymentLinks ?? [],
      listaParcelas: k.listaParcelas ?? [],
      produtos: k.produtos ?? [],
    })),
  };
}

export function loadClientesFromLocalStorage(): Cliente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepCloneClientes(mockClientes).map(hydrateCliente);
    const parsed = JSON.parse(raw) as Cliente[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return deepCloneClientes(mockClientes).map(hydrateCliente);
    }
    return parsed.map(hydrateCliente);
  } catch {
    return deepCloneClientes(mockClientes);
  }
}

export function saveClientesToLocalStorage(clientes: Cliente[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  } catch {
    /* quota exceeded etc. */
  }
}

export function resetLocalClientesToMock() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

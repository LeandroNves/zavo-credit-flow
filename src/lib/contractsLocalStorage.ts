import type { Cliente } from "@/data/mockData";
import { mockClientes } from "@/data/mockData";

const STORAGE_KEY = "zavo_clientes_v1";

function deepCloneClientes(list: Cliente[]): Cliente[] {
  return JSON.parse(JSON.stringify(list)) as Cliente[];
}

export function loadClientesFromLocalStorage(): Cliente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepCloneClientes(mockClientes);
    const parsed = JSON.parse(raw) as Cliente[];
    if (!Array.isArray(parsed) || parsed.length === 0) return deepCloneClientes(mockClientes);
    return parsed;
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

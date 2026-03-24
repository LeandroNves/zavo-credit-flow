const KEY = "zavo_cliente_atual";

/** ID do cliente cuja área `/cliente` está sendo visualizada (protótipo até haver login real). */
export function getClienteAtualId(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "1";
  } catch {
    return "1";
  }
}

export function setClienteAtualId(id: string) {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

/** Mesmas regras da etapa de senha do cadastro público (Register). */
export function validatePortalPassword(password: string): string | null {
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasLength = password.length >= 8;
  if (!hasLength) return "A senha deve ter no mínimo 8 caracteres.";
  if (!hasUpper) return "A senha deve ter pelo menos uma letra maiúscula.";
  if (!hasSpecial) return "A senha deve ter pelo menos um caractere especial.";
  return null;
}

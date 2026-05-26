# Política de segurança

## Versões suportadas

Correções de segurança são aplicadas na branch principal em uso em produção (`main`).

## Reportar uma vulnerabilidade

**Não abra issues públicas** para falhas de segurança.

Envie um e-mail para o responsável técnico do projeto Zavo com:

- Descrição do problema e impacto
- Passos para reproduzir
- Versão/commit afetado (se souber)
- Sugestão de correção (opcional)

Responderemos em até **5 dias úteis** com confirmação de recebimento. Correções críticas em produção têm prioridade.

## O que não incluir no repositório

- Arquivos `.env`, `.env.local` ou exportações com chaves reais
- `SUPABASE_SERVICE_ROLE_KEY`, senhas de admin ou tokens de API
- Dumps de banco, backups de clientes ou documentos pessoais
- Artefatos de debug (`_promissoria_extract*.txt`, `_test-merged.docx`)

O arquivo `.env.example` lista apenas nomes de variáveis, sem valores.

## Segredos em produção

| Variável | Onde configurar |
|----------|-----------------|
| `ADMIN_*`, `ADMIN_SESSION_SECRET` | Vercel → Environment Variables (Production) |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas servidor (nunca `VITE_`) |
| `VITE_SUPABASE_*` | Build do front-end (chave **anon**) |

Se uma chave foi exposta (commit, log, screenshot): **rotacione** no Supabase e na Vercel imediatamente.

## RLS e dados sensíveis

O projeto usa políticas RLS de desenvolvimento em parte do schema. Antes de expor o repositório ou ampliar o acesso:

1. Aplique migrations com RLS restritivo para produção.
2. Revise buckets de Storage (boletos e documentos de cadastro).
3. Execute o **Security Advisor** no painel Supabase.

Detalhes operacionais: [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md).

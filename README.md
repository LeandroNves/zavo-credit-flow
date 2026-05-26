# Zavo Credit Flow

Plataforma web para **crédito, parcelas e gestão de contratos** da Zavo: landing de produtos, cadastro de clientes, portal do cliente (PWA) e painel administrativo com geração de documentos Word.

Repositório destinado a uso interno. Mantenha **privado** até que as políticas RLS de produção estejam aplicadas no Supabase ([docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md)).

---

## Funcionalidades

| Área | Rotas | Descrição |
|------|-------|-----------|
| **Landing** | `/`, `/produtos` | Catálogo de produtos (Supabase `landing_products`) |
| **Cadastro** | `/cadastro` | Formulário com Auth + perfil + upload de documentos |
| **Portal cliente** | `/cliente/*` | Contratos, parcelas, boletos, dados pessoais (PWA) |
| **Admin** | `/admin/*` | Clientes, contratos, parcelas, produtos, cadastros pendentes |
| **Documentos** | API admin | Contrato e promissórias em `.docx` (docxtemplater) |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Front-end | React 18, TypeScript, Vite 5, React Router 6 |
| UI | Tailwind CSS, shadcn/ui (Radix) |
| Estado / dados | TanStack Query, Context API |
| Back-end / BaaS | Supabase (Postgres, Auth, Storage) |
| API servidor | Vercel Serverless (`api/admin/*`) + middleware no `npm run dev` |
| Documentos | docxtemplater, PizZip, merge de DOCX no servidor |
| Deploy | Vercel (SPA + functions) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React SPA + PWA)                                  │
│  VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY                   │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────┐     ┌─────────────────────────────┐
│  Supabase               │     │  Vercel / Vite middleware   │
│  Auth, Postgres,        │     │  /api/admin/login           │
│  Storage                │     │  /api/admin/products        │
│                         │     │  /api/admin/generate-doc…   │
│  RLS + policies         │     │  SUPABASE_SERVICE_ROLE_KEY  │
└───────────────────────┘     └─────────────────────────────┘
```

- **Front-end** fala com o Supabase pela chave **anon** (cadastro, portal, parte do admin em modo nuvem).
- **Operações sensíveis do admin** (catálogo global, imagens, geração de Word, rate limit de login) passam pela **API com cookie de sessão** e `service_role` no servidor.
- Sem Supabase configurado, o admin pode usar **localStorage** para desenvolvimento offline.

---

## Estrutura do projeto

```
zavo-credit-flow/
├── api/
│   ├── admin/              # Endpoints Vercel (login, produtos, documentos…)
│   └── _lib/               # Lógica compartilhada + templates Word
├── src/
│   ├── pages/              # Landing, cadastro, cliente, admin
│   ├── contexts/           # ContractsDataContext (fonte Supabase ou local)
│   ├── lib/                # Supabase, contratos, documentos, formatação BR
│   └── components/ui/      # Componentes shadcn
├── supabase/migrations/    # Schema Postgres versionado
├── public/                 # PWA, ícones, favicon
└── scripts/                # Preparação de templates DOCX
```

### Banco de dados (principais tabelas)

- `clients`, `contracts`, `installments` — carteira e parcelas
- `profiles` — cadastro vinculado ao Auth
- `landing_products` — catálogo da landing
- `product_requests` — solicitações de produto
- `admin_login_rate` — rate limit de login admin (servidor)

Migrations em ordem cronológica em `supabase/migrations/`.

### Geração de documentos

1. Templates: `api/_lib/templates/contrato.docx`, `promissoria.docx`
2. Variáveis montadas em `src/lib/documentVars.ts` (`buildContratoDocxData`, etc.)
3. `POST /api/admin/generate-document` — requer sessão admin
4. Contrato: sanitização mínima do XML (`contratoDocxSanitize.ts`) para evitar quebra de layout
5. Promissórias: várias páginas mescladas em um único `.docx`

Guia do modelo Word: [api/_lib/templates/CONTRATO_MODELO_WORD.md](api/_lib/templates/CONTRATO_MODELO_WORD.md)

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+
- Conta Supabase (opcional; sem ela o admin usa armazenamento local)
- Cópia de `.env.example` → `.env` ou `.env.local`

### Instalação

```bash
npm install
cp .env.example .env.local   # edite com suas chaves
npm run dev
```

App em **http://localhost:8080**. O Vite expõe `/api/admin/*` via middleware (`vite.config.ts`).

### Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run prepare:docx-templates` | Prepara templates Word no diretório da API |

### Variáveis de ambiente

Ver [.env.example](.env.example). Resumo:

| Variável | Onde | Uso |
|----------|------|-----|
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Servidor | Login `/admin` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Servidor | API admin, rate limit |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Build front | Cliente Supabase |

**Nunca** use `VITE_` para `service_role` ou senha de admin em produção.

### Supabase

```bash
# Com Supabase CLI configurado no projeto
supabase db push
```

Ou aplique as migrations manualmente no SQL Editor do painel Supabase, na ordem dos arquivos em `supabase/migrations/`.

---

## Deploy (Vercel)

1. Conecte o repositório à Vercel.
2. Configure as variáveis de ambiente (Production e Preview).
3. O `vercel.json` faz fallback SPA e inclui templates DOCX na function `generate-document`.

Build: `npm run build` — saída em `dist/`.

---

## Segurança

- Segredos apenas em variáveis de ambiente; `.env` está no `.gitignore`.
- Sessão admin: cookie `HttpOnly`, assinatura HMAC, rate limit por IP.
- **Atenção:** parte do schema ainda usa políticas RLS permissivas (`*_dev_*`) pensadas para desenvolvimento. Antes de ampliar acesso ao repositório ou confiar só na chave anon, endureça o RLS no Supabase.
- Política de reporte: [SECURITY.md](SECURITY.md)
- Checklist GitHub: [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md)

### Verificação: `.env` no histórico Git

```bash
git log --all --full-history -- .env .env.local
```

Se o comando não imprimir commits, o `.env` nunca foi versionado (verificado na preparação deste repositório).

---

## Rotas principais

| Rota | Público |
|------|---------|
| `/`, `/produtos`, `/login`, `/cadastro` | Sim |
| `/cliente/*` | Cliente autenticado (Supabase Auth) |
| `/admin/login` | Sim |
| `/admin/*` | Sessão admin (cookie) |

---

## Licença

Software proprietário — ver [LICENSE](LICENSE).

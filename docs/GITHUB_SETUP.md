# Configuração do repositório no GitHub

Checklist para deixar o projeto alinhado com boas práticas de segurança no GitHub.  
**Não altera produção** — apenas configurações do repositório e automações de CI.

## 1. Repositório privado

Enquanto as políticas RLS de produção não estiverem aplicadas no Supabase:

1. GitHub → repositório **zavo-credit-flow** → **Settings**
2. **Danger Zone** → **Change repository visibility** → **Private**

## 2. Secret scanning

1. **Settings** → **Code security and analysis**
2. Ative:
   - **Secret scanning**
   - **Push protection** (bloqueia push com segredos detectados), se disponível no seu plano

> Em repositórios privados gratuitos, alguns recursos avançados podem exigir GitHub Team/Enterprise. Ative o que estiver disponível.

## 3. Dependabot

O arquivo [`.github/dependabot.yml`](../.github/dependabot.yml) já agenda atualizações semanais de dependências npm.

1. **Settings** → **Code security and analysis**
2. Confirme que **Dependabot alerts** e **Dependabot security updates** estão ativos

## 4. Branch protection (recomendado)

Em **Settings** → **Branches** → **Add rule** para `main`:

- Require a pull request before merging
- Require status checks to pass (workflow **CI**)
- Do not allow bypassing the above settings

## 5. Variáveis na Vercel (produção)

Nunca copie `.env` para o GitHub. Configure em **Vercel → Project → Settings → Environment Variables**:

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 6. Verificar histórico do Git

Confirme que `.env` nunca foi commitado:

```bash
git log --all --full-history -- .env .env.local
```

(deve retornar vazio)

Se algum segredo entrou no histórico no passado, rotacione as chaves no Supabase/Vercel e considere `git filter-repo` ou suporte do GitHub para remover o segredo do histórico.

## 7. GitHub CLI (opcional)

Com [GitHub CLI](https://cli.github.com/) instalado:

```bash
gh repo edit --visibility private
gh secret scanning enable   # se disponível na sua conta
```

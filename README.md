# Equipe 4 Eixos – Controle e Manutenção de Frota

Sistema web para controle de veículos, peças, ordens de serviço, documentação, monitoramento e relatórios de custos.

## Tecnologias
- React
- Vite
- Supabase (Auth e banco de dados)

## Executar localmente
1. Instale Node.js 20 ou superior.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave publicável do projeto Supabase.
4. Execute:
   ```bash
   npm ci
   npm run dev
   ```

## Publicação
O GitHub Actions compila e publica automaticamente o projeto no GitHub Pages a cada envio para a branch `main`.

No repositório GitHub, configure os Secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings → Secrets and variables → Actions.

Em Settings → Pages, selecione `GitHub Actions` como fonte de publicação.

O Vite utiliza o caminho `/Equipe-4-Eixos/` no GitHub Pages e `/` no ambiente local.

## Segurança
Nunca envie arquivos `.env`, chaves `service_role` ou senhas para o GitHub. A chave publicável do Supabase pode estar no frontend, mas a segurança dos dados deve ser garantida pelas políticas RLS do banco.

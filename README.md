# PulsoWeb

Frontend Next.js integrado ao PulsoBackend com TanStack Query.

## Executar

1. Instale com `yarn install`.
2. Copie `.env.example` para `.env.local` e ajuste `API_BACKEND_URL`.
3. Inicie o backend com autenticação JWT e envio de e-mail configurado.
4. Execute `yarn dev` e abra http://localhost:3000.

O navegador usa `NEXT_PUBLIC_API_BASE_URL=/api`. O Next encaminha as chamadas
para `API_BACKEND_URL` (padrão http://localhost:8080).
Reinicie o Next após mudar as variáveis. Em produção, use HTTPS.

## Autenticação e termos

Contrato conferido no projeto local PulsoBackend:

- `POST /auth/login`: retorna accessToken, expiresAt, user e dados do desafio 2FA.
- `POST /auth/2fa/verify`: recebe `{ code }` (seis dígitos), retorna 204.
- `POST /auth/2fa/resend`: retorna codeExpiresAt e resendAvailableAt.
- `GET /terms`: retorna title, version e content.
- `GET /terms/accepted`: retorna as versões aceitas pelo usuário autenticado.
- `POST /terms/accept`: recebe `{ version, termsAccepted: true }`, retorna 204.
- Não há etapa de troca de senha no fluxo de entrada.
- `GET /me`: retorna o perfil completo após 2FA e aceite dos termos.
- `POST /auth/logout`: revoga a sessão.
- `POST /auth/password-reset/request`: recebe `{ email }` e envia um código de seis dígitos.
- `POST /auth/password-reset/verify`: recebe `{ email, code }` e retorna `{ resetToken }`.
- `POST /auth/password-reset/reset`: recebe `{ email, resetToken, newPassword, confirmPassword }`; o token deve ser válido por 10 minutos.
- Ao redefinir a senha, o backend deve revogar todas as sessões/JWTs existentes do usuário.

A tela pública `/forgot-password` usa esse
fluxo em três etapas: e-mail, código e nova senha. O `resetToken` fica somente
em memória no navegador e é enviado apenas na etapa final.

As chamadas usam Authorization Bearer, sem cookies antigos nem CSRF.
A sessão fica no sessionStorage da aba; senhas não são persistidas.
Login cancela consultas e limpa o cache anterior. Respostas de outra sessão
são descartadas; um 401 antigo não encerra uma sessão nova.

AuthGate protege todas as páginas antes de montar seu conteúdo. O código deve
ser confirmado antes de consultar os termos. Uma modal sem fechamento exige
leitura e aceite da versão atual; falhas de consulta ou aceite mantêm o bloqueio.
Após o aceite, o frontend consulta o perfil e encaminha para a home, sem etapa de troca de senha. A versão aceita é conferida
no servidor, inclusive ao recarregar a página, sem depender apenas do login.

O bloqueio por termos implementado aqui é de interface. O SecurityConfig do
backend consultado ainda exige troca de senha para contas com firstLogin=true, retornando 403 em /me mesmo após o aceite. O frontend não consegue remover essa restrição da API. O backend também não restringe todas as rotas
de negócio por termsAccepted; essa restrição também precisa existir no backend
para impedir chamadas diretas à API sem aceite.

As rotas do frontend usam nomes em inglês. URLs antigas em português redirecionam permanentemente para as rotas correspondentes.

## Registro e convites

- `/registration`: cadastro público de alunos com busca de escola, foto opcional e aceite da versão atual dos termos (`POST /auth/register`).
- `/invite/[token]`: confirmação do código enviado por e-mail e preenchimento do cadastro (`/invitations/{token}`, `/verify`, `/resend` e `/complete`).
- As telas de novo coordenador e professor enviam convites por `/invitations/coordinators` e `/invitations/teachers`.
- `/admin/registration-requests` e `/coordinator/registration-requests`: consulta por situação, aprovação e recusa por `/registration-requests`. O backend delimita as solicitações acessíveis a cada perfil.
- A rota antiga `/coordinator/students/new` exibe as solicitações; alunos preenchem o próprio cadastro na rota pública.

No backend, configure `app.invitation.base-url` para a URL do frontend seguida de `/invite` (ex.: `http://localhost:3000/invite`), para que os links enviados por e-mail abram a tela de cadastro.

Validação manual: cadastrar aluno com e sem foto; enviar convite; confirmar código; reenviar após o intervalo; concluir cadastro; aprovar/recusar como responsável; entrar com a conta aprovada. Convites inválidos, expirados ou utilizados devem apresentar o erro retornado pela API.

## Organização

- `src/api`: cliente HTTP e QueryProvider.
- `src/integrations/auth`: contratos e sessão JWT.
- `src/components/screens/Login/AuthGate.tsx`: proteção global e etapas de acesso.
- `src/integrations/users`, `classrooms`, `subjects`: integrações de domínio.

Módulos antigos de demonstração permanecem para referência; não são a fonte
da sessão ativa.

## Validação

- `yarn test:api`: Bearer, isolamento de sessão, respostas atrasadas, erros e 204.
- `yarn lint`: ESLint.
- `yarn tsc --noEmit`: TypeScript.
- `yarn build`: build de produção.

Validação manual com backend e e-mail: entrar com cada perfil, confirmar código
inválido/válido/expirado, reenviar após cooldown, abrir URL interna antes do aceite,
recarregar, aceitar a versão atual e alternar entre administrador e professor.

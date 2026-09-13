# PulsoWeb

Frontend Next.js integrado ao PulsoBackend com TanStack Query.

## Executar

1. Instale com `yarn install`.
2. Copie `.env.example` para `.env.local` e ajuste `API_BACKEND_URL`.
3. Inicie o backend com as rotas de login por sessão disponíveis.
4. Execute `yarn dev` e abra http://localhost:3000.

O navegador usa `NEXT_PUBLIC_API_BASE_URL=/api`. O Next encaminha as chamadas
para `API_BACKEND_URL` (padrão http://localhost:8080), preservando os cookies.
Reinicie o Next após mudar as variáveis. Em produção, use HTTPS.

## Organização

- `src/api`: URL base, cliente HTTP e QueryProvider.
- `src/integrations/auth`: login, logout e usuário autenticado.
- `src/integrations/users`: alunos, professores e coordenadores.
- `src/integrations/classrooms`: salas e vínculos.
- `src/integrations/subjects`: listagem e criação de disciplinas.
- `src/components/screens/Integration`: telas conectadas às rotas reais.

O cliente obtém CSRF antes das escritas. Login e logout usam sessão por cookie;
não há senha ou token de autenticação persistido no armazenamento do navegador.
Listagens de usuários são paginadas. As mutações atualizam o cache e não têm
retentativa automática, evitando repetir cadastros e envios de e-mail.

As páginas ativas usam o backend, não os stores da demonstração. Os módulos
antigos de mocks foram mantidos para referência e para os testes antigos.
Escolas, turnos, datas de nascimento, temas e quizzes ainda não são suportados
pelos contratos disponíveis. A gestão de escolas aparece como indisponível.
O cadastro de aluno é independente; faça o vínculo na página da turma.
Um aluno já matriculado é transferido quando vinculado a outra turma.

## Validação

- `yarn test:api`: contratos do cliente HTTP (cookies, CSRF, erros e 204).
- `yarn lint`: ESLint.
- `yarn tsc --noEmit`: TypeScript.
- `yarn build`: build de produção.

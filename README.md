# PulsoWeb

Aplicação web do Pulso Escolar para acompanhar e organizar informações da rotina escolar. Desenvolvida com Next.js, React e TypeScript, com integração ao PulsoBackend.

## Como iniciar

Tenha Node.js e Yarn instalados.

1. Instale as dependências:

   ```sh
   yarn install
   ```

2. Copie `.env.example` para `.env.local` e configure o endereço do backend:

   ```env
   API_BACKEND_URL=http://localhost:8080
   NEXT_PUBLIC_API_BASE_URL=/api
   ```

3. Inicie o PulsoBackend com autenticação e envio de e-mail configurados.
4. Inicie o frontend:

   ```sh
   yarn dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

Reinicie o frontend após alterar as variáveis de ambiente.

## Comandos

| Comando | Descrição |
| --- | --- |
| `yarn install` | Instala as dependências. |
| `yarn dev` | Inicia o servidor de desenvolvimento. |
| `yarn build` | Gera o build de produção. |
| `yarn start` | Inicia o servidor de produção após executar `yarn build`. |
| `yarn lint` | Verifica o código com ESLint. |
| `yarn tsc --noEmit` | Verifica os tipos TypeScript. |
| `yarn test` | Executa os testes Jest. |
| `yarn test:watch` | Executa os testes novamente ao alterar arquivos. |
| `yarn test:coverage` | Executa os testes e gera o relatório de cobertura, com mínimo global de 80%. |
| `yarn test:auth` | Executa os testes de autenticação. |
| `yarn test:main` | Executa os testes da área principal. |
| `yarn test:api` | Executa as verificações do cliente HTTP e dos termos. |
| `yarn test:mock` | Executa os testes dos módulos demonstrativos. |

Os testes Jest ficam em `tests/auth` e `tests/main`. O relatório de cobertura é gerado em `coverage/index.html`.

No PowerShell com execução de scripts desabilitada, use `yarn.cmd` no lugar de `yarn`.

# DPRate: back-end (PHP + MySQL)

Parte do Pedro no Assessment 2 (INT1059 Advanced Web).
Segue o contrato `API_CONTRACT_PARA_PEDRO.md`, feito pelo Davi.

## Como rodar (XAMPP no Windows)

1. Abra o XAMPP e inicie o **MySQL** e o **Apache**. O Apache é necessário para abrir o phpMyAdmin.
2. Crie o banco importando o dump: abra `http://localhost/phpmyadmin`, aba **Import**, escolha `backend/database/dprate.sql` e clique em **Go**.
3. Na pasta do projeto, rode o PHP (ajuste o caminho se o XAMPP estiver em outro lugar):

   ```
   C:\xampp\php\php.exe -S 127.0.0.1:8000 -t backend/public
   ```

4. Em outro terminal, rode o React na pasta `frontend`:

   ```
   npm install
   npm run dev
   ```

5. Abra o endereço que o Vite mostrar (por padrão `http://localhost:5173`).

O Vite manda tudo que começa com `/api` para `127.0.0.1:8000`, então o React não precisa saber a porta do PHP.

**Configuração do banco:** `backend/includes/config.php`. Os valores padrão são os do XAMPP (usuário `root`, sem senha). Se o seu MySQL tiver senha, mude `db_pass`.

## Endpoints

| Endpoint | Método | O que faz |
|---|---|---|
| `/api/games.php` | GET | Lista todos os jogos em ordem aleatória (Home) |
| `/api/game.php?id=2` | GET | Detalhes de um jogo (Game Details) |
| `/api/register.php` | POST | Cria conta e já loga |
| `/api/login.php` | POST | Login com usuário ou e-mail |
| `/api/session.php` | GET | Usuário logado, ou `null` |
| `/api/logout.php` | POST | Encerra a sessão |

Erros voltam em JSON com `success: false` e um `message`, com o código HTTP certo (400, 401, 404, 405, 409, 422).

## Segurança

- Senha guardada só como hash (`password_hash`), nunca devolvida na resposta.
- Consultas com prepared statements do PDO (proteção contra SQL injection).
- Sessão em cookie `HttpOnly` e `SameSite=Lax`, então o JavaScript não lê o cookie.
- Login com senha errada e usuário inexistente recebem a mesma mensagem.
- Erros internos são gravados no log do PHP, não mostrados ao navegador.

## Arquivos

```
backend/
  README.md
  database/dprate.sql        estrutura + dados (dump para o relatório)
  includes/config.php        configuração do banco
  includes/db.php            conexão PDO
  includes/helpers.php       respostas JSON, sessão, formatação dos jogos
  public/api/*.php           os 6 endpoints
```

## Testes feitos

- Os 6 endpoints testados com `curl` no PHP 8.3 e MariaDB 10.11:
  lista e detalhe de jogo, 404 e 400 para id inválido, cadastro (201), e-mail e senha inválidos (422), usuário duplicado (409), JSON inválido (400), login por usuário e por e-mail (200), login errado (401), logout e sessão voltando a `null`.
- Confirmado no banco que a senha fica como hash `$2y$` com 60 caracteres.
- **Ainda não testado:** a integração no navegador com o React (ver o relatório). Rode `npm run dev` e teste o fluxo na tela.

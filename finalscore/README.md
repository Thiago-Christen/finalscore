# FinalScore RA2

Projeto React + Vite com API local em Node/Express e MySQL.

## O que já fica pronto

- login e cadastro
- API local na porta `3001`
- proxy do Vite para `/api`
- banco local MySQL
- seed automático com Mockaroo quando não houver campeonatos no banco
- dados demo para começar rápido

## Instalação

Na raiz do projeto:

```bash
npm install
```

O `postinstall` também instala as dependências do backend.

## Rodar em desenvolvimento

```bash
npm run dev
```

O front sobe em `http://localhost:5173` e a API em `http://localhost:3001`.

## Banco local

Crie o banco `FinalScore` no MySQL ou ajuste o `.env` do backend com suas credenciais.

### `.env` do backend

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=FinalScore
JWT_SECRET=finalscore-secret
BCRYPT_ROUNDS=10
MOCKAROO_API_KEY=sua_chave_mockaroo
```

Se a chave do Mockaroo não estiver configurada, o backend usa fallback local e continua funcionando.

## Acesso inicial

Quando o banco estiver vazio, o backend cria um usuário demo:

- e-mail: `admin@email.com`
- senha: `123456`

Depois do login, você pode criar um campeonato vazio ou gerar os dados automaticamente.

# Secretaria WMS - Sistema Oficial de Controle de Estoque

Sistema completo de gerenciamento de estoque (WMS) desenvolvido para a **Equipe Secretaria do Encontro de Jovens com Cristo (EJC) Cocaia 2026**.

## Funcionalidades

- **Dashboard em Tempo Real** - KPIs, graficos e atividade recente
- **Controle de Estoque** - Cadastro, edicao e exclusao de produtos com variacoes
- **Emprestimos** - Registro de retirada de materiais por equipe
- **Devolucoes** - Processo completo com validacoes e alertas
- **Ocorrencias** - Registro manual e automatico de problemas
- **Relatorios** - Exportacao em PDF, Excel e CSV
- **Logs de Auditoria** - Rastreamento completo de acoes
- **Painel TV** - Dashboard fullscreen para exibicao em TVs
- **Notificacoes em Tempo Real** - Via Socket.IO
- **Multi-nivel de Acesso** - Admin, Coordenador e Integrante
- **Recuperacao de Senha** - Via email SMTP

## Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Node.js + Express + Socket.IO
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticacao**: JWT + bcrypt
- **Email**: Nodemailer com Gmail SMTP
- **Relatorios**: jsPDF + xlsx

## Instalacao

```bash
# Clone o repositorio
git clone <url>
cd secretaria-wms

# Instale as dependencias
npm install

# Configure as variaveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configuracoes

# Inicie o servidor de desenvolvimento
npm run dev
```

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Inicia frontend + backend em paralelo |
| `npm run dev:client` | Inicia apenas o frontend |
| `npm run server:dev` | Inicia apenas o backend |
| `npm run build` | Build do frontend |
| `npm run build:full` | Build completo (frontend + backend) |
| `npm start` | Inicia em producao |

## Configuracao do MongoDB

1. Instale o MongoDB localmente ou use o MongoDB Atlas
2. Configure a variavel `MONGODB_URI` no `.env`
3. O sistema criara automaticamente o admin padrao

## Configuracao do SMTP Gmail

1. Ative a autenticacao de 2 fatores na conta Google
2. Gere uma "Senha de App" em https://myaccount.google.com/apppasswords
3. Configure `SMTP_EMAIL` e `SMTP_PASSWORD` no `.env`

## Credenciais Padrao

- **Admin**: `adminplataforma` / `adminplataforma12345`

## Deploy na Vercel

1. Crie uma conta em https://vercel.com
2. Importe o projeto do GitHub
3. Configure as variaveis de ambiente
4. O `vercel.json` ja esta configurado

## Equipes do EJC

Acolhida, Alegria, Animacao, Apoio, Cafe, Cozinha, Dirigente, Encerramento, Garcom, Geral, Intercessao, Liturgia, Minibar, Ordem, Sala, Secretaria, Vigilia, Visitacao, Outros.

---

**Equipe Secretaria | EJC Cocaia 2026**

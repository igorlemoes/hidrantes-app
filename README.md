# Hidrantes App

Aplicação web para gerenciamento de hidrantes de incêndio com mapa interativo, autenticação de usuários e relatórios em planilha.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Tecnologias

- **Next.js 16** - Framework React com Turbopack
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Supabase** - Backend (Banco de dados + Autenticação + Storage)
- **Leaflet** - Mapa interativo
- **PWA** - Progressive Web App instalável

## Funcionalidades

- Visualização de mapa com todos os hidrantes
- Localização automática do usuário via GPS
- Cadastro de novos hidrantes com foto
- Edição e exclusão de hidrantes (usuários autenticados)
- Status: Ótimo, Bom, Regular, Péssimo, Inativo
- Geração de planilha CSV filtrada por cidade
- Autenticação com restrição de domínio de email
- Funciona offline (PWA)
- Instalável como app no celular

## Pré-requisitos

- Node.js 18+
- Conta no Supabase (gratuita)
- npm ou yarn

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd hidrantes-app
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-pública
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=seu-dominio.com
```

#### Obtendo as credenciais do Supabase:

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings > API**
4. Copie o **Project URL** para `NEXT_PUBLIC_SUPABASE_URL`
5. Copie o **anon public** key para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configurar o banco de dados

Acesse o SQL Editor no painel do Supabase e execute o script `supabase-setup.sql`:

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `supabase-setup.sql`
4. Clique em **Run**

Este script irá:
- Criar a tabela `hidrantes`
- Habilitar segurança RLS
- Criar políticas de acesso (público para leitura, autenticado para escrita)
- Criar bucket de storage para fotos
- Criar índices para performance

### 5. Configurar Autenticação (opcional)

Se quiser habilitar confirmação de email:

1. No painel do Supabase, vá em **Authentication > Providers**
2. Configure o provedor de email (Supabase Auth já vem configurado por padrão)
3. Para testar localmente, você pode desabilitar a confirmação de email em **Authentication > Users**

### 6. Executar localmente

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## Implantação na Vercel

### 1. Preparar o repositório

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`
4. Deploy!

### 3. Configurar domínios permitidos no Supabase

No painel do Supabase, vá em **Authentication > URL Configuration** e adicione a URL de produção:

- Site URL: `https://seu-projeto.vercel.app`
- Redirect URLs: `https://seu-projeto.vercel.app/**`

## Estrutura do Projeto

```
hidrantes-app/
├── public/
│   ├── favicon.svg        # Ícone do app
│   ├── manifest.json      # Manifesto PWA
│   └── sw.js              # Service Worker
├── src/
│   ├── app/
│   │   ├── layout.tsx    # Layout principal
│   │   ├── page.tsx      # Página inicial (mapa)
│   │   └── login/        # Página de login
│   ├── components/
│   │   ├── dashboard.tsx # Componente principal
│   │   ├── map.tsx       # Componente do mapa
│   │   └── ui/           # Componentes shadcn/ui
│   ├── lib/
│   │   ├── supabase.ts   # Cliente Supabase
│   │   └── utils.ts      # Funções utilitárias
│   └── types/
│       └── hydrant.ts    # Tipos TypeScript
├── supabase-setup.sql    # Script de setup do banco
└── package.json
```

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJhbGciOiJIUzI1...` |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | Domínio de email permitido para cadastro | `empresa.com` |

## Status dos Hidrantes

| Status | Cor | Descrição |
|--------|------|-----------|
| Ótimo | Verde esmeralda | Hidrante em perfeito estado |
| Bom | Verde | Funcionando adequadamente |
| Regular | Amarelo | Requer atenção em breve |
| Péssimo | Laranja | Requer manutenção urgente |
| Inativo | Vermelho | Fora de serviço |

## Como Usar

### Para usuários comuns:
1. Acesse o mapa
2. Clique em um hidrante para ver detalhes
3. Use "Abrir Rota" para navegação até o hidrante

### Para operadores (usuários autenticados):
1. Faça login com email do domínio permitido
2. Clique em "Adicionar Hidrante" no mapa
3. Toque na posição correta no mapa
4. Preencha os dados e tire uma foto
5. Salve o hidrante

### Gerar Relatórios:
1. Faça login
2. Abra a lista de hidrantes (ícone de lista)
3. Clique em "Planilha"
4. Selecione a cidade para filtrar
5. Baixe o CSV

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório.

## Contributing

Contribuições são bem-vindas! Abra uma issue primeiro para discutir mudanças significativas.

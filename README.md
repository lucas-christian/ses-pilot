# 🚀 SES Pilot - Gerenciador de Templates Amazon SES

Uma plataforma moderna e intuitiva para gerenciar templates de e-mail do Amazon SES com sincronização local/AWS.

## ✨ Características

### 🎨 Interface Moderna
- **Design Responsivo**: Interface adaptável para desktop e mobile
- **Tema Claro/Escuro**: Suporte completo a temas com toggle automático
- **Componentes shadcn/ui**: Interface consistente e acessível
- **Animações Suaves**: Transições e micro-interações fluidas

### 🌍 Internacionalização
- **Suporte a Múltiplos Idiomas**: Português e Inglês
- **Sistema de Tradução Simples**: Baseado em chaves hierárquicas
- **Fallback Automático**: Traduções em português como padrão
- **Seletor de Idioma**: Toggle fácil entre idiomas

### 📧 Gerenciamento de Templates
- **CRUD Completo**: Criar, Ler, Atualizar e Deletar templates
- **Editor de Código Avançado**: Monaco Editor com syntax highlighting
- **Preview em Tempo Real**: Visualização instantânea dos e-mails
- **Templates de Verificação**: Suporte específico para e-mails de verificação

### 🔄 Sincronização AWS
- **Status de Sincronização**: Indicadores visuais do estado dos templates
- **Pull da AWS**: Importar templates existentes da AWS
- **Deploy para AWS**: Enviar templates locais para a AWS
- **Detecção de Conflitos**: Identificação automática de diferenças

### 🛠️ Funcionalidades Técnicas
- **Arquivos Locais**: Trabalho primário com arquivos locais
- **Sincronização Inteligente**: Preferência por conteúdo local
- **Estrutura de Pastas**: Organização hierárquica de templates
- **Configuração Flexível**: Suporte a configurações locais e globais

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Configuração AWS SES

### Setup
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ses-pilot.git
cd ses-pilot

# Instale as dependências
npm install

# Configure as credenciais AWS
# Crie um arquivo ses-pilot.config.json na raiz do projeto
{
  "templatesPath": "./ses-templates"
}

# Inicie o desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
ses-pilot/
├── src/
│   ├── cli/                 # CLI para gerenciamento
│   └── web/                 # Interface web
│       ├── app/             # Páginas Next.js
│       ├── components/       # Componentes React
│       │   ├── ui/          # Componentes shadcn/ui
│       │   ├── layout/      # Componentes de layout
│       │   └── providers/   # Providers de contexto
│       ├── features/        # Funcionalidades específicas
│       ├── hooks/           # Hooks customizados
│       ├── lib/             # Utilitários e configurações
│       └── locales/         # Arquivos de tradução
├── ses-templates/           # Templates locais
└── boilerplate/            # Templates de exemplo
```

## 🎯 Uso

### Interface Web
1. **Acesse**: `http://localhost:3000`
2. **Navegue**: Use a sidebar para acessar templates
3. **Edite**: Clique em um template para editar
4. **Sincronize**: Use os botões de pull/deploy para sincronizar com AWS

### CLI
```bash
# Listar templates
ses-pilot list

# Criar novo template
ses-pilot create

# Sincronizar com AWS
ses-pilot sync

# Deploy para AWS
ses-pilot deploy
```

## 🎨 Temas e Personalização

### Tema Claro/Escuro
- Toggle automático baseado nas preferências do sistema
- Controle manual via botão na interface
- Persistência da escolha do usuário

### Cores e Estilos
- Sistema de cores baseado em CSS variables
- Componentes consistentes com shadcn/ui
- Totalmente customizável via Tailwind CSS

## 🌍 Internacionalização

### Adicionando Novos Idiomas
1. Adicione as traduções em `src/web/lib/i18n.ts`
2. Atualize o tipo `Locale`
3. Adicione a opção no seletor de idioma

### Estrutura de Traduções
```typescript
{
  common: {
    welcome: 'Bem-vindo',
    save: 'Salvar',
    // ...
  },
  templates: {
    title: 'Templates de E-mail',
    // ...
  }
}
```

## 🔧 Configuração

### AWS SES
```json
{
  "aws": {
    "region": "us-east-1",
    "accessKeyId": "YOUR_ACCESS_KEY",
    "secretAccessKey": "YOUR_SECRET_KEY"
  }
}
```

### Estrutura de Templates
```
ses-templates/
├── welcome/
│   ├── template.json
│   └── template.html
├── verification/
│   ├── template.json
│   └── template.html
└── notifications/
    ├── template.json
    └── template.html
```

## 🚀 Deploy

### Build de Produção
```bash
npm run build
npm start
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com/) - Componentes de UI
- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Editor de código
- [Lucide React](https://lucide.dev/) - Ícones

---

Desenvolvido com ❤️ por [Seu Nome](https://github.com/seu-usuario)
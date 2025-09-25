# ✈️ SES Pilot - CLI para Gerenciar Templates Amazon SES

Uma ferramenta de linha de comando moderna para gerenciar templates de e-mail do Amazon SES com interface web integrada.

## ✨ Características Principais

### 🖥️ CLI Global
- **Instalação Global**: Use em qualquer projeto com `npm install -g`
- **Interface Amigável**: Comandos intuitivos com feedback colorido
- **Configuração Flexível**: Modo local (por projeto) ou global (sistema)
- **Inicialização Simples**: Setup automático com `ses-pilot init`

### 🌐 Interface Web Integrada
- **Servidor Local**: Interface web moderna acessível via `ses-pilot start`
- **Design Responsivo**: Interface adaptável para desktop e mobile
- **Tema Claro/Escuro**: Suporte completo a temas com toggle automático
- **Editor Avançado**: Monaco Editor com syntax highlighting para HTML/CSS

### 📧 Gerenciamento Completo
- **Templates SES**: Criação e edição de templates do Amazon SES
- **Preview em Tempo Real**: Visualização instantânea dos e-mails
- **Sincronização AWS**: Importar/exportar templates da AWS
- **Teste de E-mail**: Envio de e-mails de teste diretamente da interface

### 🌍 Suporte Internacional
- **Português e Inglês**: Interface totalmente traduzida
- **Sistema de Tradução**: Baseado em chaves hierárquicas
- **Seletor de Idioma**: Toggle fácil entre idiomas na interface

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm (geralmente vem com Node.js)
- Credenciais AWS configuradas (opcional, para sincronização)

### Instalação Global via NPM
```bash
# Instalar globalmente
npm install -g @dev-luch/ses-pilot

# Verificar instalação
ses-pilot --help
```

### Uso Rápido
```bash
# 1. Criar um novo projeto ou navegar para um existente
mkdir meu-projeto-email
cd meu-projeto-email

# 2. Inicializar configuração
ses-pilot init

# 3. Iniciar interface web
ses-pilot start
```

A interface web estará disponível em `http://localhost:5359`

## 📁 Estrutura Criada

Após executar `ses-pilot init`, será criada a seguinte estrutura:

### Modo Local (por projeto)
```
seu-projeto/
├── ses-pilot.config.json    # Configuração local
└── ses-templates/           # Templates do projeto
    ├── template1.verification.json
    └── template2.verification.json
```

### Modo Global (sistema)
```
~/.ses-pilot/               # Diretório home do usuário
├── config.json            # Configuração global
└── templates/              # Templates globais
    ├── template1.verification.json
    └── template2.verification.json
```

## 🎯 Comandos Disponíveis

### CLI Principal
```bash
# Mostrar ajuda
ses-pilot --help

# Inicializar configuração (modo local ou global)
ses-pilot init

# Iniciar interface web
ses-pilot start
```

### Interface Web
1. **Acesse**: `http://localhost:5359` (após `ses-pilot start`)
2. **Navegue**: Use a sidebar para acessar templates
3. **Edite**: Clique em um template para editar no Monaco Editor
4. **Preview**: Visualize o e-mail em tempo real
5. **Teste**: Envie e-mails de teste diretamente da interface
6. **Sincronize**: Use os botões de pull/deploy para sincronizar com AWS

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

## 🔧 Configuração AWS (Opcional)

Para usar as funcionalidades de sincronização com AWS SES, configure suas credenciais AWS:

### Opção 1: AWS CLI (Recomendado)
```bash
# Instalar AWS CLI
npm install -g @aws-sdk/client-ses

# Configurar credenciais
aws configure
```

### Opção 2: Variáveis de Ambiente
```bash
export AWS_ACCESS_KEY_ID="sua_access_key"
export AWS_SECRET_ACCESS_KEY="sua_secret_key"
export AWS_REGION="us-east-1"
```

### Opção 3: Arquivo de Configuração
Crie um arquivo `.env` no diretório onde executar o `ses-pilot`:
```env
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
```

## 📧 Formato dos Templates

Os templates seguem o formato JSON do Amazon SES:

```json
{
  "TemplateName": "MeuTemplate",
  "Subject": "Assunto do E-mail",
  "HtmlPart": "<html><body>Conteúdo HTML</body></html>",
  "TextPart": "Conteúdo em texto simples"
}
```

## 🚀 Recursos da Interface

### Editor de Código
- **Monaco Editor**: O mesmo editor do VS Code
- **Syntax Highlighting**: Para HTML, CSS e JavaScript
- **Auto-complete**: Sugestões inteligentes
- **Formatação Automática**: Código sempre bem formatado

### Preview em Tempo Real
- **Visualização Instantânea**: Veja as mudanças em tempo real
- **Responsivo**: Teste em diferentes tamanhos de tela
- **Variáveis Dinâmicas**: Suporte a placeholders do SES

### Teste de E-mail
- **Envio Direto**: Teste seus templates enviando e-mails reais
- **Configuração Simples**: Configure destinatário e variáveis
- **Logs Detalhados**: Veja o status dos envios

## 🔄 Desinstalação

Para remover o SES Pilot:

```bash
# Desinstalar globalmente
npm uninstall -g @dev-luch/ses-pilot

# Limpar configurações globais (opcional)
rm -rf ~/.ses-pilot
```

## 🆘 Solução de Problemas

### Problemas Comuns

**Erro de permissão ao instalar globalmente:**
```bash
# Use sudo no macOS/Linux ou execute como administrador no Windows
sudo npm install -g @dev-luch/ses-pilot
```

**Porta 5359 já em uso:**
- O SES Pilot tentará encontrar uma porta disponível automaticamente
- Se necessário, mate processos que estejam usando a porta

**Problemas de conexão AWS:**
- Verifique suas credenciais AWS
- Confirme se a região está correta
- Certifique-se de ter permissões para SES

### Logs e Debug
```bash
# Ver versão instalada
ses-pilot --version

# Verificar se está funcionando
ses-pilot --help
```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] Suporte a mais tipos de templates (transacionais, marketing)
- [ ] Integração com outros provedores de e-mail
- [ ] Sistema de versionamento de templates
- [ ] Backup automático para Git
- [ ] Métricas e analytics de templates

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença ISC.

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com/) - Componentes de UI modernos
- [Next.js](https://nextjs.org/) - Framework React de alta performance
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Editor de código do VS Code
- [Commander.js](https://github.com/tj/commander.js/) - Framework para CLI
- [Chalk](https://github.com/chalk/chalk) - Cores para terminal

---

**SES Pilot** - Desenvolvido com ❤️ para simplificar o gerenciamento de templates Amazon SES
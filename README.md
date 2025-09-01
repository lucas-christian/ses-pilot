# dlasm - Dev Luch AWS SES Manager

![npm](https://img.shields.io/npm/v/@dev-luch/ses-pilot) **dlasm** (acrônimo para **Dev Luch AWS SES Manager**) é uma ferramenta de linha de comando (CLI) interativa projetada para acelerar e simplificar o fluxo de trabalho de criação, gerenciamento e deploy de templates de e-mail no AWS Simple Email Service (SES).

Instale globalmente e gerencie seus templates de e-mail em qualquer projeto, diretamente do seu terminal.

## Recursos Principais

- **Criação de Templates**: Crie rapidamente a estrutura de arquivos (`template.html`, `template.json`, `send-email.json`) para um novo template com conteúdo inicial.
- **Deploy Automatizado**: Minifica seu HTML e faz o deploy do template para a AWS, criando ou atualizando conforme necessário.
- **Rastreamento de Arquivos**: A interface desabilita ações de forma inteligente se arquivos essenciais estiverem faltando em uma pasta de template, prevenindo erros.
- **Teste e Preview**: Envie e-mails de teste com dados dinâmicos e visualize o HTML localmente em diferentes navegadores.
- **Gerenciamento Completo**: Delete templates da AWS diretamente pela CLI.
- **Interface Intuitiva e Multilíngue**: Um menu interativo que suporta Inglês e Português, com detecção automática de idioma.

## Pré-requisitos

1.  **Node.js**: Versão LTS (18.x ou superior) é recomendada.
2.  **AWS CLI**: A ferramenta deve estar instalada e configurada com suas credenciais. Execute `aws configure` se você ainda não o fez.

## Instalação

Instale o `ses-pilot` globalmente através do NPM. Isso tornará o comando `ses-pilot` disponível em qualquer lugar no seu sistema.

```bash
npm install -g ses-pilot
```
*(Nota: O nome `ses-pilot` pode já estar em uso no NPM. Se estiver, você precisará escolher um nome único no seu `package.json` antes de publicar.)*

## Como Usar

1.  Navegue até a pasta onde você deseja gerenciar seus templates de e-mail.
    ```bash
    mkdir meus-emails-de-projeto
    cd meus-emails-de-projeto
    ```
2.  Execute o comando:
    ```bash
    ses-pilot
    ```
    ou
    ```bash
    npx ses-pilot
    ```
3.  O menu principal será exibido.

### Criando seu Primeiro Template

-   Na primeira vez que usar em uma pasta vazia, a opção principal será **"✨ CREATE NEW TEMPLATE"**.
-   Selecione-a e siga as instruções para nomear seu template.
-   A ferramenta criará uma nova pasta com os arquivos `template.html`, `template.json` e `send-email.json` prontos para você editar.

### Gerenciando Templates Existentes

-   Execute `ses-pilot` na pasta que contém seus diretórios de template.
-   A lista de templates existentes aparecerá no menu principal.
-   Selecione um template para ver as ações disponíveis (Criar/Atualizar na AWS, Enviar Teste, etc.).

## Publicando no NPM (Instruções para Você)

Quando estiver pronto para compartilhar sua ferramenta com o mundo:

1.  Crie uma conta em [npmjs.com](https://www.npmjs.com/).
2.  No seu terminal, faça login na sua conta:
    ```bash
    npm login
    ```
3.  Certifique-se de que a versão no seu `package.json` é única.
4.  Execute o comando para publicar:
    ```bash
    npm publish
    ```

Pronto! Sua ferramenta agora está pública e pode ser instalada por qualquer pessoa.
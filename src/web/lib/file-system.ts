import fs from 'fs-extra';
import path from 'path';

/**
 * Define a estrutura de um nó na árvore de templates.
 * Pode ser uma pasta comum ou uma pasta de template válida.
 */
export interface TemplateNode {
  name: string;
  // Caminho relativo a partir da raiz, ex: "marketing/welcome-email"
  relativePath: string; 
  type: 'folder' | 'template';
  children?: TemplateNode[];
}

/**
 * Escaneia um diretório recursivamente e monta uma árvore de templates.
 * @param rootDir O caminho absoluto para o diretório raiz dos templates.
 * @returns Uma promessa que resolve para um array de nós da árvore.
 */
export async function getTemplates(rootDir: string): Promise<TemplateNode[]> {
  // Função auxiliar recursiva para escanear os diretórios
  const scan = async (currentPath: string, relativePath: string): Promise<TemplateNode[]> => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const nodes: TemplateNode[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryPath = path.join(currentPath, entry.name);
        const newRelativePath = path.join(relativePath, entry.name);

        // Verifica se é uma pasta de template válida (contém template.json)
        const isTemplate = await fs.pathExists(path.join(entryPath, 'template.json'));

        if (isTemplate) {
          nodes.push({
            name: entry.name,
            relativePath: newRelativePath,
            type: 'template',
          });
        } else {
          // Se for uma pasta comum, escaneia os filhos
          const children = await scan(entryPath, newRelativePath);
          if (children.length > 0) {
            nodes.push({
              name: entry.name,
              relativePath: newRelativePath,
              type: 'folder',
              children,
            });
          }
        }
      }
    }
    // Ordena para exibir pastas primeiro, depois templates, ambos alfabeticamente
    return nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'template') return -1;
        if (a.type === 'template' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });
  };

  // Inicia o escaneamento a partir da raiz
  return scan(rootDir, '');
}

/**
 * Lê os detalhes de um template específico (HTML e JSON).
 * @param rootDir O caminho absoluto para o diretório raiz dos templates.
 * @param slug Um array de strings representando o caminho relativo do template.
 * @returns Uma promessa que resolve para o conteúdo HTML e JSON do template.
 */
export async function getTemplateDetails(rootDir: string, slug: string[]) {
  const templatePath = path.join(rootDir, ...slug);
  const htmlPath = path.join(templatePath, 'template.html');
  
  // Determina se é um template de verificação baseado no caminho
  const isVerificationTemplate = slug.includes('_verification');
  const jsonPath = path.join(templatePath, isVerificationTemplate ? 'verification-template.json' : 'template.json');

  if (!(await fs.pathExists(templatePath))) {
    throw new Error('Template not found');
  }

  const htmlContent = await fs.readFile(htmlPath, 'utf-8');
  const templateJson = await fs.readJson(jsonPath);

  return { htmlContent, templateJson };
}

/**
 * Cria uma nova estrutura de template (pasta e arquivos base).
 * @param rootDir O caminho raiz dos templates.
 * @param relativePath O caminho relativo onde a nova pasta será criada (ex: "marketing").
 * @param templateName O nome da nova pasta do template.
 * @param subject O assunto inicial para o template.
 */
export async function createTemplate(rootDir: string, relativePath: string, templateName: string, subject: string) {
  const newTemplateDir = path.join(rootDir, relativePath, templateName);

  if (await fs.pathExists(newTemplateDir)) {
    throw new Error('Um template com este nome já existe neste local.');
  }
  await fs.ensureDir(newTemplateDir);

  const boilerplate = {
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>${subject}</title>
  </head>
  <body>
    <h1>Olá, {{name}}!</h1>
    <p>Este é seu novo template.</p>
  </body>
</html>`,
    templateJson: {
      Template: {
        TemplateName: `${templateName}Template`, // Sugestão de nome para a AWS
        SubjectPart: subject,
        HtmlPart: "" // Será preenchido no deploy
      }
    },
    sendJson: {
      Source: "sender@example.com",
      Template: `${templateName}Template`,
      Destination: { ToAddresses: ["recipient@example.com"] },
      TemplateData: JSON.stringify({ name: "Usuário Teste" })
    }
  };

  await Promise.all([
    fs.writeFile(path.join(newTemplateDir, 'template.html'), boilerplate.html),
    fs.writeJson(path.join(newTemplateDir, 'template.json'), boilerplate.templateJson, { spaces: 2 }),
    fs.writeJson(path.join(newTemplateDir, 'send-email.json'), boilerplate.sendJson, { spaces: 2 }),
  ]);

  return { path: path.join(relativePath, templateName) };
}

/**
 * Atualiza o conteúdo de um template existente.
 * @param rootDir O caminho raiz dos templates.
 * @param slug O caminho para o template a ser atualizado.
 * @param content O novo conteúdo (HTML e/ou JSON).
 */
export async function updateTemplate(rootDir: string, slug: string[], content: { htmlContent: string; templateJson: unknown }) {
  const templatePath = path.join(rootDir, ...slug);
  const htmlPath = path.join(templatePath, 'template.html');
  
  // Determina se é um template de verificação baseado no caminho
  const isVerificationTemplate = slug.includes('_verification');
  const jsonPath = path.join(templatePath, isVerificationTemplate ? 'verification-template.json' : 'template.json');

  await Promise.all([
    fs.writeFile(htmlPath, content.htmlContent),
    fs.writeJson(jsonPath, content.templateJson, { spaces: 2 }),
  ]);
}

/**
 * Deleta a pasta e todo o conteúdo de um template.
 * @param rootDir O caminho raiz dos templates.
 * @param slug O caminho para o template a ser deletado.
 */
export async function deleteTemplate(rootDir: string, slug: string[]) {
  const templatePath = path.join(rootDir, ...slug);
  await fs.remove(templatePath);
}

/**
 * Escaneia o subdiretório `_verification` e monta uma árvore de templates.
 * @param rootDir O caminho absoluto para o diretório raiz dos templates.
 * @returns Uma promessa que resolve para um array de nós da árvore.
 */
export async function getVerificationTemplates(rootDir: string): Promise<TemplateNode[]> {
  const verificationRootDir = path.join(rootDir, '_verification');
  if (!(await fs.pathExists(verificationRootDir))) {
    return []; // Se a pasta _verification não existe, não há templates.
  }

  // A lógica de escaneamento é idêntica à de getTemplates, mas em um diretório diferente
  // e procurando por um arquivo de manifesto diferente.
  const scan = async (currentPath: string, relativePath: string): Promise<TemplateNode[]> => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const nodes: TemplateNode[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryPath = path.join(currentPath, entry.name);
        const newRelativePath = path.join(relativePath, entry.name);
        
        // A "marca" de um template de verificação é o arquivo `verification-template.json`
        const isTemplate = await fs.pathExists(path.join(entryPath, 'verification-template.json'));

        if (isTemplate) {
          nodes.push({ name: entry.name, relativePath: newRelativePath, type: 'template' });
        } else {
          // Se for uma pasta comum, escaneia os filhos
          const children = await scan(entryPath, newRelativePath);
          if (children.length > 0) {
            nodes.push({ name: entry.name, relativePath: newRelativePath, type: 'folder', children });
          }
        }
      }
    }
    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  };
  
  return scan(verificationRootDir, '');
}

/**
 * Conta recursivamente o número de templates em uma árvore de nós.
 * @param nodes Array de nós da árvore de templates.
 * @returns Número total de templates encontrados.
 */
export function countTemplates(nodes: TemplateNode[]): number {
  let count = 0;
  
  for (const node of nodes) {
    if (node.type === 'template') {
      count++;
    } else if (node.children) {
      count += countTemplates(node.children);
    }
  }
  
  return count;
}
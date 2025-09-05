import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getRemoteTemplateContent } from '@/lib/aws';
import fs from 'fs-extra';
import path from 'path';

async function importTemplate(rootDir: string, templateName: string) {
    console.log(`Importando template: ${templateName}`);
    console.log(`Root directory: ${rootDir}`);
    
    const remoteContent = await getRemoteTemplateContent(templateName);
    console.log(`Conteúdo remoto obtido:`, { subject: remoteContent.Subject, htmlLength: remoteContent.Html.length });
    
    // Determina se é um template de verificação baseado no nome
    const isVerificationTemplate = templateName.includes('verification') || templateName.includes('verify');
    console.log(`É template de verificação: ${isVerificationTemplate}`);
    
    const basePath = isVerificationTemplate ? path.join(rootDir, '_verification') : rootDir;
    const localTemplatePath = path.join(basePath, templateName);
    console.log(`Caminho base: ${basePath}`);
    console.log(`Caminho do template: ${localTemplatePath}`);
    
    await fs.ensureDir(localTemplatePath);
    console.log(`Diretório criado: ${localTemplatePath}`);
    
    const templateJson = {
        Template: {
            TemplateName: templateName,
            SubjectPart: remoteContent.Subject,
        }
    };
    
    // Para templates de verificação, usa verification-template.json
    const jsonFileName = isVerificationTemplate ? 'verification-template.json' : 'template.json';
    console.log(`Arquivo JSON: ${jsonFileName}`);
    
    await fs.writeFile(path.join(localTemplatePath, 'template.html'), remoteContent.Html);
    await fs.writeJson(path.join(localTemplatePath, jsonFileName), templateJson, { spaces: 2 });
    
    console.log(`Template importado com sucesso: ${templateName}`);
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateNames } = body as { templateNames: string[] };
    if (!templateNames || !Array.isArray(templateNames)) {
      return NextResponse.json({ error: 'Uma lista de nomes de templates é obrigatória.' }, { status: 400 });
    }

    console.log(`Processando importação de ${templateNames.length} templates:`, templateNames);
    console.log(`Current working directory: ${process.cwd()}`);
    
    const templatesPath = await getTemplatesPath();
    console.log(`Templates path: ${templatesPath}`);
    
    // Executa todas as importações em paralelo para mais performance
    await Promise.all(templateNames.map(name => importTemplate(templatesPath, name)));
    
    console.log(`Importação concluída com sucesso!`);
    return NextResponse.json({ message: `${templateNames.length} templates importados com sucesso.` });
  } catch (error: unknown) {
    console.error(`Erro na importação:`, error);
    return NextResponse.json({ error: 'Falha ao importar templates.', details: (error as { message: string; }).message }, { status: 500 });
  }
}
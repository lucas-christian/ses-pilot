import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getRemoteTemplateContent } from '@/lib/aws';
import path from 'path';
import fs from 'fs-extra';

// Este endpoint irá importar ou sobrescrever um template local com a versão da AWS.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateName } = body; // O nome do template na AWS
    if (!templateName) {
      return NextResponse.json({ error: 'O nome do template é obrigatório.' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    const remoteContent = await getRemoteTemplateContent(templateName);

    // Lógica para criar/atualizar arquivos locais
    const localTemplatePath = path.join(templatesPath, templateName); // Simplificação: assume que o template fica na raiz
    await fs.ensureDir(localTemplatePath);
    
    const templateJson = {
        Template: {
            TemplateName: templateName,
            SubjectPart: remoteContent.Subject,
            HtmlPart: "" // Deixamos em branco, pois a fonte da verdade é o .html
        }
    };
    
    await fs.writeFile(path.join(localTemplatePath, 'template.html'), remoteContent.Html);
    await fs.writeJson(path.join(localTemplatePath, 'template.json'), templateJson, { spaces: 2 });
    
    return NextResponse.json({ message: `Template "${templateName}" importado/atualizado com sucesso.` });
  } catch (error: any) {
    return NextResponse.json({ error: 'Falha ao importar template.', details: error.message }, { status: 500 });
  }
}
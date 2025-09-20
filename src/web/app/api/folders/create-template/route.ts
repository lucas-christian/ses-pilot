import { NextRequest, NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import fs from 'fs-extra';
import path from 'path';

// POST - Criar template em pasta específica
export async function POST(request: NextRequest) {
  try {
    const { folderId, templateName } = await request.json();
    
    if (!templateName) {
      return NextResponse.json({ error: 'Nome do template é obrigatório' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    const verificationPath = path.join(templatesPath, '_verification');
    
    const folderPath = folderId === 'root' 
      ? verificationPath 
      : path.join(verificationPath, folderId);
    
    const templatePath = path.join(folderPath, `${templateName}.json`);
    
    // Verificar se o template já existe
    if (await fs.pathExists(templatePath)) {
      return NextResponse.json({ error: 'Template já existe' }, { status: 409 });
    }
    
    // Template padrão
    const defaultTemplate = {
      Template: {
        TemplateName: templateName,
        SubjectPart: "Assunto do Template",
        HtmlPart: "<h1>Conteúdo HTML</h1>",
        TextPart: "Conteúdo Texto"
      }
    };

    await fs.writeJson(templatePath, defaultTemplate, { spaces: 2 });
    
    return NextResponse.json({ success: true, path: templatePath });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar template', details: (error as Error).message },
      { status: 500 }
    );
  }
}

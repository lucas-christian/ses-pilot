import { NextRequest, NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import fs from 'fs-extra';
import path from 'path';

// POST - Criar template em pasta específica
export async function POST(request: NextRequest) {
  try {
    const { folderId, templateName, templateType = 'verification' } = await request.json();
    
    if (!templateName) {
      return NextResponse.json({ error: 'Nome do template é obrigatório' }, { status: 400 });
    }

    // Validar nome do template
    if (!/^[a-zA-Z0-9_-]+$/.test(templateName)) {
      return NextResponse.json(
        { error: 'Nome do template deve conter apenas letras, números, _ ou -' },
        { status: 400 }
      );
    }

    const templatesPath = await getTemplatesPath();
    
    const folderPath = folderId === 'ses-templates' || folderId === 'root'
      ? templatesPath  // Criar diretamente na pasta ses-templates
      : path.join(templatesPath, folderId);
    
    // Verificar se o diretório pai existe
    if (!await fs.pathExists(folderPath)) {
      return NextResponse.json(
        { error: 'Pasta pai não existe' },
        { status: 404 }
      );
    }
    
    // Garantir que o diretório existe
    await fs.ensureDir(folderPath);
    
    // Nome do arquivo com extensão correta
    // Se estiver na pasta raiz ses-templates, usar extensão completa
    // Se estiver dentro de uma subpasta, usar apenas o nome do template
    const isInRootFolder = folderPath === templatesPath;
    
    const fileName = (templateType === 'verification' && isInRootFolder)
      ? `${templateName}.verification.json`
      : `${templateName}.json`;
    
    const templatePath = path.join(folderPath, fileName);
    
    // Verificar se o template já existe
    if (await fs.pathExists(templatePath)) {
      return NextResponse.json({ error: 'Template já existe' }, { status: 409 });
    }
    
    // Template padrão para verificação de email
    const defaultTemplate = {
      Template: {
        TemplateName: templateName,
        SubjectPart: "Confirme seu e-mail"
      },
      FromEmailAddress: "Confirme seu e-mail <noreply@exemplo.com>",
      SuccessRedirectionURL: "https://exemplo.com/email_confirmed",
      FailureRedirectionURL: "https://exemplo.com/email_failed"
    };

    await fs.writeJson(templatePath, defaultTemplate, { spaces: 2 });
    
    console.log(`Template criado com sucesso: ${templatePath}`);
    return NextResponse.json({ success: true, path: templatePath });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { error: 'Erro ao criar template', details: (error as Error).message },
      { status: 500 }
    );
  }
}

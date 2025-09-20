import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { listRemoteVerificationTemplates } from '@/lib/aws';
import fs from 'fs-extra';
import path from 'path';

export async function POST() {
  try {
    const templatesPath = await getTemplatesPath();
    
    if (!templatesPath) {
      return NextResponse.json(
        { error: 'O caminho para os templates não está configurado.' },
        { status: 500 }
      );
    }

    // Busca todos os templates de verificação da AWS
    const awsTemplates = await listRemoteVerificationTemplates();
    
    const savedTemplates = [];
    
    for (const template of awsTemplates) {
      // Cria o nome do arquivo: template-name.verification.json
      const fileName = `${template.TemplateName}.verification.json`;
      const filePath = path.join(templatesPath, fileName);
      
      // Cria o conteúdo do arquivo no formato esperado
      const templateContent = {
        Template: {
          TemplateName: template.TemplateName,
          SubjectPart: template.Subject || 'Assunto do Template',
        },
        FromEmailAddress: 'Confirme seu e-mail <noreply@exemplo.com>',
        SuccessRedirectionURL: 'https://exemplo.com/email_confirmed',
        FailureRedirectionURL: 'https://exemplo.com/email_failed'
      };
      
      // Salva o arquivo
      await fs.writeJson(filePath, templateContent, { spaces: 2 });
      savedTemplates.push({
        fileName,
        templateName: template.TemplateName
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `${savedTemplates.length} templates de verificação puxados da AWS com sucesso!`,
      templates: savedTemplates
    });
    
  } catch (error: unknown) {
    console.error('Erro ao puxar templates da AWS:', error);
    return NextResponse.json(
      { 
        error: 'Falha ao puxar templates da AWS.', 
        details: (error as { message: string; }).message 
      }, 
      { status: 500 }
    );
  }
}

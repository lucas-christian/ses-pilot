import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { listRemoteVerificationTemplates, getRemoteTemplateContent } from '@/lib/aws';
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
      try {
        // Busca o conteúdo completo do template
        const templateContent = await getRemoteTemplateContent(template.TemplateName);
        
        // Cria o nome do arquivo: template-name.verification.json
        const fileName = `${template.TemplateName}.verification.json`;
        const filePath = path.join(templatesPath, fileName);
        
        // Cria o conteúdo do arquivo no formato esperado
        const verificationTemplate = {
          Template: {
            TemplateName: template.TemplateName,
            SubjectPart: templateContent.Subject || template.Subject || 'Assunto do Template',
          },
          HtmlPart: templateContent.Html || '<h1>Template HTML não encontrado</h1>',
          FromEmailAddress: templateContent.FromEmailAddress || template.FromEmailAddress || 'Confirme seu e-mail <noreply@exemplo.com>',
          SuccessRedirectionURL: templateContent.SuccessRedirectionURL || 'https://exemplo.com/email_confirmed',
          FailureRedirectionURL: templateContent.FailureRedirectionURL || 'https://exemplo.com/email_failed'
        };
        
        // Salva o arquivo
        await fs.writeJson(filePath, verificationTemplate, { spaces: 2 });
        savedTemplates.push({
          fileName,
          templateName: template.TemplateName
        });
      } catch (error) {
        console.error(`Erro ao processar template ${template.TemplateName}:`, error);
        // Continua com os outros templates mesmo se um falhar
      }
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

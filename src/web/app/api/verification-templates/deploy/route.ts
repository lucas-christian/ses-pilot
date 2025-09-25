import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getTemplateDetails } from '@/lib/file-system';
import { deployVerificationTemplate } from '@/lib/aws';
import { minifyHtml, normalizeFromEmailAddress, normalizeText } from '@/lib/template-utils';
import fs from 'fs-extra';
import path from 'path';

export async function POST(request: Request) {
  const templatesPath = await getTemplatesPath();
  
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const { slug, templateData } = await request.json();
    
    if (!slug || !Array.isArray(slug)) {
      return NextResponse.json(
        { error: 'Slug do template é obrigatório.' },
        { status: 400 }
      );
    }

    // Primeiro, salva localmente se templateData foi fornecido
    if (templateData) {
      const templateName = slug.join('/');
      const verificationJsonPath = path.join(templatesPath, `${templateName}.verification.json`);
      
      if (await fs.pathExists(verificationJsonPath)) {
        // Minifica o HTML
        const minifiedHtml = await minifyHtml(templateData.htmlContent);
        
        // Normaliza o e-mail de origem
        const normalizedFromEmail = normalizeFromEmailAddress(templateData.templateJson.FromEmailAddress);
        
        // Atualiza o arquivo .verification.json com o HTML minificado e e-mail normalizado
        const updatedTemplateJson = {
          ...templateData.templateJson,
          HtmlPart: minifiedHtml,
          FromEmailAddress: normalizedFromEmail,
          Template: {
            ...templateData.templateJson.Template,
            SubjectPart: normalizeText(templateData.templateJson.Template.SubjectPart || 'Confirme seu e-mail')
          }
        };
        
        await fs.writeJson(verificationJsonPath, updatedTemplateJson, { spaces: 2 });
      }
    }

    // Depois, busca os detalhes do template (agora atualizado)
    const templateName = slug.join('/');
    const verificationJsonPath = path.join(templatesPath, `${templateName}.verification.json`);
    
    if (await fs.pathExists(verificationJsonPath)) {
      const templateJson = await fs.readJson(verificationJsonPath);
      const templateDetails = {
        htmlContent: templateJson.HtmlPart || '',
        templateJson: templateJson
      };
      
      // Chama o serviço de deploy
      await deployVerificationTemplate(templateDetails);
    } else {
      // Fallback para estrutura antiga
      const verificationPath = ['_verification', ...slug];
      const templateDetails = await getTemplateDetails(templatesPath, verificationPath);
      await deployVerificationTemplate(templateDetails);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Template de verificação "${slug.join('/')}" salvo localmente e enviado para a AWS com sucesso.` 
    });
  } catch (error: unknown) {
    console.error('Erro na API de deploy de templates de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (error as { message?: string }).message }, 
      { status: 500 }
    );
  }
}

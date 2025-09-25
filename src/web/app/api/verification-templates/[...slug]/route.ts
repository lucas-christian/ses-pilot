import { NextResponse } from 'next/server';
import { deleteTemplate, getTemplateDetails, updateTemplate } from '@/lib/file-system';
import { getTemplatesPath } from '@/lib/config';
import { deployVerificationTemplate } from '@/lib/aws';
import { minifyHtml, normalizeFromEmailAddress, normalizeText, decodeHtmlEntities, formatHtml } from '@/lib/template-utils';
import fs from 'fs-extra';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const templatesPath = await getTemplatesPath();

  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    // Primeiro tenta como arquivo .verification.json direto no diretório raiz
    const templateName = slug.join('/');
    const verificationJsonPath = path.join(templatesPath, `${templateName}.verification.json`);
    
    if (await fs.pathExists(verificationJsonPath)) {
      // Lê o arquivo .verification.json diretamente
      const templateJson = await fs.readJson(verificationJsonPath);
      
      // Usa o HtmlPart do arquivo .verification.json
      let htmlContent = '';
      
      if (templateJson.HtmlPart) {
        htmlContent = templateJson.HtmlPart;
      } else {
        // Se não encontrar HtmlPart, procura por um arquivo HTML correspondente
        const htmlPath = path.join(templatesPath, `${templateName}.html`);
        if (await fs.pathExists(htmlPath)) {
          htmlContent = await fs.readFile(htmlPath, 'utf-8');
        } else {
          // Se não encontrar HTML, usa um template padrão
          htmlContent = '<html><body><h1>Template de Verificação</h1><p>Conteúdo HTML não encontrado.</p></body></html>';
        }
      }
      
      // Decodifica entidades HTML e formata para exibição
      const decodedHtmlContent = decodeHtmlEntities(htmlContent);
      const formattedHtmlContent = formatHtml(decodedHtmlContent);
      const decodedTemplateJson = {
        ...templateJson,
        Template: {
          ...templateJson.Template,
          SubjectPart: decodeHtmlEntities(templateJson.Template.SubjectPart || '')
        },
        FromEmailAddress: decodeHtmlEntities(templateJson.FromEmailAddress || '')
      };
      
      return NextResponse.json({ htmlContent: formattedHtmlContent, templateJson: decodedTemplateJson });
    }
    
    // Se não encontrar como arquivo direto, tenta a estrutura de pastas _verification
    const verificationPath = ['_verification', ...slug];
    const details = await getTemplateDetails(templatesPath, verificationPath);
    return NextResponse.json(details);
  } catch (error: unknown) {
    // Se o erro for "Template not found", retornamos um 404
    if ((error as { message?: string; }).message === 'Template not found') {
        return NextResponse.json({ error: 'Template de verificação não encontrado.' }, { status: 404 });
    }
    
    // Para outros erros, é um problema no servidor
    return NextResponse.json(
      { error: 'Falha ao ler os detalhes do template de verificação.', details: (error as { message?: string; }).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const templatesPath = await getTemplatesPath();
  
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { htmlContent, templateJson } = body;

    if (!htmlContent || !templateJson) {
      return NextResponse.json(
        { error: 'Conteúdo HTML e JSON do template são obrigatórios.' },
        { status: 400 }
      );
    }

    // Primeiro tenta como arquivo .verification.json direto no diretório raiz
    const templateName = slug.join('/');
    const verificationJsonPath = path.join(templatesPath, `${templateName}.verification.json`);
    
    if (await fs.pathExists(verificationJsonPath)) {
      // Minifica o HTML
      const minifiedHtml = await minifyHtml(htmlContent);
      
      // Normaliza o e-mail de origem
      const normalizedFromEmail = normalizeFromEmailAddress(templateJson.FromEmailAddress);
      
      // Atualiza o arquivo .verification.json com o HTML minificado e e-mail normalizado
      const updatedTemplateJson = {
        ...templateJson,
        HtmlPart: minifiedHtml,
        FromEmailAddress: normalizedFromEmail,
        Template: {
          ...templateJson.Template,
          SubjectPart: normalizeText(templateJson.Template.SubjectPart || 'Confirme seu e-mail')
        }
      };
      await fs.writeJson(verificationJsonPath, updatedTemplateJson, { spaces: 2 });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Template de verificação atualizado com sucesso!' 
      });
    }
    
    // Se não encontrar como arquivo direto, tenta a estrutura de pastas _verification
    const verificationPath = ['_verification', ...slug];
    await updateTemplate(templatesPath, verificationPath, { htmlContent, templateJson });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Template de verificação atualizado com sucesso!' 
    });
  } catch (error: unknown) {
    console.error('Erro na API de templates de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (error as { message?: string }).message }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const templatesPath = await getTemplatesPath();
  
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    const actions = {
      'test-email': async () => {
        const body = await request.json();
        const { email } = body;

        if (!email) {
          return NextResponse.json(
            { error: 'E-mail de destino é obrigatório.' },
            { status: 400 }
          );
        }

        // Validação básica de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { error: 'E-mail inválido.' },
            { status: 400 }
          );
        }

        // Verifica se o template de verificação existe localmente
        const fs = await import('fs-extra');
        const path = await import('path');
        
        const templateName = slug.join('/');
        const fileName = `${templateName}.verification.json`;
        const filePath = path.join(templatesPath, fileName);
        
        if (!(await fs.pathExists(filePath))) {
          return NextResponse.json(
            { error: 'Template de verificação não encontrado localmente.' },
            { status: 404 }
          );
        }

        // Verifica se o template de verificação existe na AWS
        const { execa } = await import('execa');
        try {
          await execa('aws', ['sesv2', 'get-custom-verification-email-template', '--template-name', slug.join('/')]);
        } catch {
          return NextResponse.json(
            { error: 'Template de verificação não encontrado na AWS. Implante o template primeiro.' },
            { status: 404 }
          );
        }

        // Prepara o payload para envio de teste de verificação (estrutura do send-email.json)
        const testEmailPayload = {
          EmailAddress: email,
          TemplateName: slug.join('/')
        };

        // Salva o payload em arquivo temporário
        const os = await import('os');
        
        const tempJsonPath = path.join(os.tmpdir(), `ses-test-verification-email-${Date.now()}.json`);
        await fs.writeJson(tempJsonPath, testEmailPayload);

        try {
          // Envia o e-mail de teste usando AWS CLI
          console.log(`Enviando e-mail de teste de verificação para: ${email}`);
          await execa('aws', ['sesv2', 'send-custom-verification-email', '--cli-input-json', `file://${tempJsonPath}`]);
          
          return NextResponse.json({ 
            success: true, 
            message: 'E-mail de teste de verificação enviado com sucesso!' 
          });
        } catch (error: unknown) {
          console.error("Erro ao enviar e-mail de teste de verificação:", error);
          const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
          return NextResponse.json(
            { error: 'Falha ao enviar e-mail de teste de verificação', details: errorMessage },
            { status: 500 }
          );
        } finally {
          // Remove o arquivo temporário
          try {
            await fs.remove(tempJsonPath);
          } catch (cleanupError) {
            console.warn('Erro ao remover arquivo temporário:', cleanupError);
          }
        }
      },
      'update': async () => {
        const body = await request.json();
        const { htmlContent, templateJson } = body;

        if (!htmlContent || !templateJson) {
          return NextResponse.json(
            { error: 'Conteúdo HTML e JSON do template são obrigatórios.' },
            { status: 400 }
          );
        }

        // Para templates de verificação, adicionamos o prefixo _verification
        const verificationPath = ['_verification', ...slug];
        await updateTemplate(templatesPath, verificationPath, { htmlContent, templateJson });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Template de verificação atualizado com sucesso!' 
        });
      },
      'deploy': async () => {
        // 1. Encontra e lê os arquivos do template de verificação local
        const verificationPath = ['_verification', ...slug];
        const templateDetails = await getTemplateDetails(templatesPath, verificationPath);

        // 2. Chama o serviço de deploy
        await deployVerificationTemplate(templateDetails);

        return NextResponse.json({ 
          success: true, 
          message: `Template de verificação "${slug.join('/')}" enviado para a AWS com sucesso.` 
        });
      },
      'pull': async () => {
        // Puxa o template específico da AWS
        const templateName = slug.join('/');
        const { getRemoteTemplateContent } = await import('@/lib/aws');
        
        try {
          // Busca o conteúdo do template na AWS
          const templateContent = await getRemoteTemplateContent(templateName);
          
          // Cria o nome do arquivo: template-name.verification.json
          const fileName = `${templateName}.verification.json`;
          const filePath = path.join(templatesPath, fileName);
          
          let existingTemplate = {};
          
          // Tenta ler o arquivo existente
          if (await fs.pathExists(filePath)) {
            try {
              existingTemplate = await fs.readJson(filePath);
            } catch (error) {
              console.warn(`Erro ao ler arquivo existente ${fileName}:`, error);
              // Se não conseguir ler, usa um template vazio
            }
          }
          
          // Atualiza apenas o SubjectPart e HtmlPart, preservando o resto
          const updatedTemplate = {
            ...existingTemplate,
            Template: {
              ...((existingTemplate as Record<string, unknown>).Template || {}),
              TemplateName: templateName,
              SubjectPart: templateContent.Subject || 'Assunto do Template',
            },
            HtmlPart: templateContent.Html || '<h1>Template HTML não encontrado</h1>'
          };
          
          // Salva o arquivo atualizado
          await fs.writeJson(filePath, updatedTemplate, { spaces: 2 });
          
          // Decodifica entidades HTML e formata para exibição (mesmo processo do GET)
          const { decodeHtmlEntities, formatHtml } = await import('@/lib/template-utils');
          
          const decodedHtmlContent = decodeHtmlEntities(updatedTemplate.HtmlPart || '');
          const formattedHtmlContent = formatHtml(decodedHtmlContent);
          
          const decodedTemplateJson = {
            ...updatedTemplate,
            Template: {
              ...(updatedTemplate.Template as Record<string, unknown>),
              SubjectPart: decodeHtmlEntities((updatedTemplate.Template as Record<string, unknown>)?.SubjectPart as string || '')
            },
            FromEmailAddress: decodeHtmlEntities((updatedTemplate as Record<string, unknown>).FromEmailAddress as string || '')
          };
          
          // Retorna no formato esperado pelo frontend (mesmo formato do GET)
          const frontendTemplate = {
            htmlContent: formattedHtmlContent,
            templateJson: decodedTemplateJson
          };
          
          return NextResponse.json({
            success: true,
            message: `Template "${templateName}" puxado da AWS com sucesso!`,
            ...frontendTemplate
          });
          
        } catch (error) {
          console.error(`Erro ao puxar template ${templateName}:`, error);
          return NextResponse.json(
            { error: `Falha ao puxar template "${templateName}" da AWS.` },
            { status: 500 }
          );
        }
      }
    };

    const execAction = actions[action as keyof typeof actions];
    if (!execAction) {
      return NextResponse.json(
        { error: `Ação '${action}' não encontrada. Ações disponíveis: test-email, update, deploy, pull` },
        { status: 400 }
      );
    }

    return await execAction();
  } catch (error: unknown) {
    console.error('Erro na API de templates de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (error as { message?: string }).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const templatesPath = await getTemplatesPath();
  
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    // Primeiro tenta como arquivo .verification.json direto no diretório raiz
    const templateName = slug.join('/');
    const verificationJsonPath = path.join(templatesPath, `${templateName}.verification.json`);
    
    if (await fs.pathExists(verificationJsonPath)) {
      // Remove o arquivo .verification.json
      await fs.remove(verificationJsonPath);
      
      // Remove o arquivo HTML correspondente se existir
      const htmlPath = path.join(templatesPath, `${templateName}.html`);
      if (await fs.pathExists(htmlPath)) {
        await fs.remove(htmlPath);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Template de verificação excluído com sucesso!' 
      });
    }
    
    // Se não encontrar como arquivo direto, tenta a estrutura de pastas _verification
    const verificationPath = ['_verification', ...slug];
    await deleteTemplate(templatesPath, verificationPath);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Template de verificação excluído com sucesso!' 
    });
  } catch (error: unknown) {
    console.error('Erro na API de templates de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (error as { message?: string }).message },
      { status: 500 }
    );
  }
}
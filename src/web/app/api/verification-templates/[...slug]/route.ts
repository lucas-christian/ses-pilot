import { NextResponse } from 'next/server';
import { deleteTemplate, getTemplateDetails, updateTemplate } from '@/lib/file-system';
import { getTemplatesPath } from '@/lib/config';
import { deployVerificationTemplate } from '@/lib/aws';

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
    // Para templates de verificação, adicionamos o prefixo _verification
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

    // Para templates de verificação, adicionamos o prefixo _verification
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

        // Carrega os detalhes do template de verificação
        const verificationPath = ['_verification', ...slug];
        const templateDetails = await getTemplateDetails(templatesPath, verificationPath);
        
        if (!templateDetails) {
          return NextResponse.json(
            { error: 'Template de verificação não encontrado.' },
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

        // Prepara o payload para envio de teste de verificação
        const testEmailPayload = {
          EmailAddress: email,
          TemplateName: slug.join('/'),
          ConfigurationSetName: undefined // Opcional
        };

        // Salva o payload em arquivo temporário
        const fs = await import('fs-extra');
        const path = await import('path');
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
      }
    };

    const execAction = actions[action as keyof typeof actions];
    if (!execAction) {
      return NextResponse.json(
        { error: `Ação '${action}' não encontrada. Ações disponíveis: test-email, update, deploy` },
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
    // Para templates de verificação, adicionamos o prefixo _verification
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
import { NextResponse } from 'next/server';
import { deleteTemplate, getTemplateDetails, updateTemplate } from '@/lib/file-system';
import { getTemplatesPath } from '@/lib/config';

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
    const details = await getTemplateDetails(templatesPath, slug);
    return NextResponse.json(details);
  } catch (error: unknown) {
    // Se o erro for "Template not found", retornamos um 404
    if ((error as { message?: string; }).message === 'Template not found') {
        return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 });
    }
    
    // Para outros erros, é um problema no servidor
    return NextResponse.json(
      { error: 'Falha ao ler os detalhes do template.', details: (error as { message?: string; }).message },
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
    await updateTemplate(templatesPath, slug, body);
    return NextResponse.json({ message: 'Template salvo com sucesso.' });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Falha ao salvar o template.', details: (error as { message?: string }).message }, { status: 500 });
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
    
    if (action === 'test-email') {
      // Envio de e-mail de teste
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

      // Carrega os detalhes do template
      const templateDetails = await getTemplateDetails(templatesPath, slug);
      
      if (!templateDetails) {
        return NextResponse.json(
          { error: 'Template não encontrado.' },
          { status: 404 }
        );
      }

      // Prepara o payload para envio de teste
      const testEmailPayload = {
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: templateDetails.htmlContent || ''
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: templateDetails.templateJson?.Template?.SubjectPart || 'Teste de E-mail'
          }
        },
        Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@example.com'
      };

      // Salva o payload em arquivo temporário
      const { execa } = await import('execa');
      const fs = await import('fs-extra');
      const path = await import('path');
      const os = await import('os');
      
      const tempJsonPath = path.join(os.tmpdir(), `ses-test-email-${Date.now()}.json`);
      await fs.writeJson(tempJsonPath, testEmailPayload);

      try {
        // Envia o e-mail de teste usando AWS CLI
        console.log(`Enviando e-mail de teste para: ${email}`);
        await execa('aws', ['sesv2', 'send-email', '--cli-input-json', `file://${tempJsonPath}`]);
        
        return NextResponse.json({ 
          success: true, 
          message: 'E-mail de teste enviado com sucesso!' 
        });
      } catch (error: unknown) {
        console.error("Erro ao enviar e-mail de teste:", error);
        const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
        return NextResponse.json(
          { 
            success: false, 
            error: 'Falha ao enviar e-mail de teste.', 
            details: errorMessage 
          },
          { status: 500 }
        );
      } finally {
        // Remove o arquivo temporário
        await fs.remove(tempJsonPath);
      }
    } else {
      // Atualização normal do template
      const body = await request.json();
      await updateTemplate(templatesPath, slug, body);
      return NextResponse.json({ message: 'Template salvo com sucesso.' });
    }
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Falha ao processar solicitação.', details: (error as { message?: string }).message }, { status: 500 });
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
        await deleteTemplate(templatesPath, slug);
        return NextResponse.json({ message: 'Template deletado com sucesso.' }, { status: 200 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Falha ao deletar o template.', details: (error as { message?: string }).message }, { status: 500 });
    }
}
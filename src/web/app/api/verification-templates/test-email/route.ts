import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getTemplateDetails } from '@/lib/file-system';

export async function POST(request: Request) {
  const templatesPath = await getTemplatesPath();
  
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const { slug, email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail de destino é obrigatório.' },
        { status: 400 }
      );
    }

    if (!slug || !Array.isArray(slug)) {
      return NextResponse.json(
        { error: 'Slug do template é obrigatório.' },
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
  } catch (error: unknown) {
    console.error('Erro na API de teste de e-mail de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (error as { message?: string }).message }, 
      { status: 500 }
    );
  }
}

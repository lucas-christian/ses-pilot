import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getTemplateDetails } from '@/lib/file-system';
import { deployVerificationTemplate } from '@/lib/aws';

export async function POST(request: Request) {
  const templatesPath = await getTemplatesPath();
  
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const { slug } = await request.json();
    
    if (!slug || !Array.isArray(slug)) {
      return NextResponse.json(
        { error: 'Slug do template é obrigatório.' },
        { status: 400 }
      );
    }

    // Para templates de verificação, adicionamos o prefixo _verification
    const verificationPath = ['_verification', ...slug];
    const templateDetails = await getTemplateDetails(templatesPath, verificationPath);

    // Chama o serviço de deploy
    await deployVerificationTemplate(templateDetails);

    return NextResponse.json({ 
      success: true, 
      message: `Template de verificação "${slug.join('/')}" enviado para a AWS com sucesso.` 
    });
  } catch (error: unknown) {
    console.error('Erro na API de deploy de templates de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (error as { message?: string }).message }, 
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createVerificationTemplate } from '@/lib/file-system';
import { getTemplatesPath } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { templateName } = await request.json();
    
    if (!templateName || !templateName.trim()) {
      return NextResponse.json(
        { error: 'Nome do template é obrigatório.' },
        { status: 400 }
      );
    }

    const templatesPath = await getTemplatesPath();
    
    if (!templatesPath) {
      return NextResponse.json(
        { error: 'O caminho para os templates não está configurado.' },
        { status: 500 }
      );
    }

    const result = await createVerificationTemplate(templatesPath, templateName.trim());
    
    return NextResponse.json({ 
      success: true, 
      message: 'Template de verificação criado com sucesso!',
      path: result.path
    });
  } catch (error: unknown) {
    const errorMessage = (error as { message?: string }).message || 'Erro desconhecido';
    
    if (errorMessage.includes('já existe')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar template de verificação.', details: errorMessage },
      { status: 500 }
    );
  }
}

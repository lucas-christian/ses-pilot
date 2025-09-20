import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getTemplates, getVerificationTemplates, countTemplates } from '@/lib/file-system';

export async function GET() {
  try {
    const templatesPath = await getTemplatesPath();
    
    // Busca as árvores de templates
    const [emailTemplates, verificationTemplates] = await Promise.all([
      getTemplates(templatesPath),
      getVerificationTemplates(templatesPath)
    ]);

    // Conta os templates
    const emailCount = countTemplates(emailTemplates);
    const verificationCount = countTemplates(verificationTemplates);

    return NextResponse.json({
      emailTemplates: emailCount,
      verificationTemplates: verificationCount,
      total: emailCount + verificationCount
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { 
        error: 'Falha ao obter contagens de templates.', 
        details: (error as { message: string; }).message 
      }, 
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getTemplateDetails } from '@/lib/file-system';
import { deployTemplate } from '@/lib/aws';

export async function POST(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  const { slug } = params;

  try {
    // 1. Encontra e lê os arquivos do template local
    const templatesPath = await getTemplatesPath();
    const templateDetails = await getTemplateDetails(templatesPath, slug);

    // 2. Chama o serviço de deploy
    await deployTemplate(templateDetails);

    return NextResponse.json({ message: `Template "${slug.join('/')}" enviado para a AWS com sucesso.` });
  } catch (error: unknown) {
    console.error('Erro na API de deploy:', error);
    return NextResponse.json(
      { error: 'Falha no deploy do template.', details: (error as { message: string; }).message },
      { status: 500 }
    );
  }
}
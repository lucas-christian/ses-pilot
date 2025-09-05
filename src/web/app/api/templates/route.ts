import { NextResponse } from 'next/server';
import { createTemplate, getTemplates } from '@/lib/file-system';
import { getTemplatesPath } from '@/lib/config';

export async function GET() {
  const templatesPath = await getTemplatesPath();

  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const templates = await getTemplates(templatesPath);
    return NextResponse.json(templates);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Falha ao ler o diretório de templates.', details: (error as { message?: string; }).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const templatesPath = await getTemplatesPath();
  if (!templatesPath) {
    return NextResponse.json(
      { error: 'O caminho para os templates não está configurado.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { relativePath, templateName, subject } = body;

    if (!templateName || !subject) {
      return NextResponse.json({ error: 'Nome do template e assunto são obrigatórios.' }, { status: 400 });
    }

    const newTemplate = await createTemplate(templatesPath, relativePath || '', templateName, subject);
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: unknown) {
    if ((error as { message: string }).message.includes('já existe')) {
        return NextResponse.json({ error: (error as { message: string }).message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Falha ao criar template.', details: (error as { message: string }).message }, { status: 500 });
  }
}
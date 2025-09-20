import { NextRequest, NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import fs from 'fs-extra';
import path from 'path';

// POST - Mover template entre pastas
export async function POST(request: NextRequest) {
  try {
    const { templateId, fromFolderId, toFolderId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json({ error: 'ID do template é obrigatório' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    const verificationPath = path.join(templatesPath, '_verification');
    
    const fromPath = fromFolderId === 'root' 
      ? verificationPath 
      : path.join(verificationPath, fromFolderId);
    
    const toPath = toFolderId === 'root' 
      ? verificationPath 
      : path.join(verificationPath, toFolderId);

    const sourcePath = path.join(fromPath, `${templateId}.json`);
    const destPath = path.join(toPath, `${templateId}.json`);

    // Verificar se o arquivo existe
    if (!await fs.pathExists(sourcePath)) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Criar pasta de destino se não existir
    await fs.ensureDir(toPath);

    // Mover arquivo
    await fs.move(sourcePath, destPath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao mover template', details: (error as Error).message },
      { status: 500 }
    );
  }
}

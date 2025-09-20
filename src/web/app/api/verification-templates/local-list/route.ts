import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import fs from 'fs-extra';
import path from 'path';

export async function GET() {
  try {
    const templatesPath = await getTemplatesPath();
    
    if (!templatesPath) {
      return NextResponse.json(
        { error: 'O caminho para os templates não está configurado.' },
        { status: 500 }
      );
    }

    const templates = [];
    
    // Buscar arquivos .verification.json na raiz
    const files = await fs.readdir(templatesPath);
    
    for (const file of files) {
      if (file.endsWith('.verification.json')) {
        const filePath = path.join(templatesPath, file);
        const stats = await fs.stat(filePath);
        
        // Ler o conteúdo do arquivo para obter o nome do template
        let templateName = file.replace('.verification.json', '');
        try {
          const content = await fs.readJson(filePath);
          templateName = content.Template?.TemplateName || templateName;
        } catch {
          // Se não conseguir ler o JSON, usa o nome do arquivo
        }
        
        templates.push({
          name: templateName,
          path: file,
          type: 'verification',
          lastModified: stats.mtime.toISOString()
        });
      }
    }
    
    return NextResponse.json({
      templates,
      count: templates.length
    });
    
  } catch (error: unknown) {
    console.error('Erro ao buscar templates locais:', error);
    return NextResponse.json(
      { 
        error: 'Falha ao buscar templates locais.', 
        details: (error as { message: string; }).message 
      }, 
      { status: 500 }
    );
  }
}

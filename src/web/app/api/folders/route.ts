import { NextRequest, NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import fs from 'fs-extra';
import path from 'path';

export interface FolderStructure {
  id: string;
  name: string;
  type: 'folder' | 'template';
  children?: FolderStructure[];
  isExpanded?: boolean;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
  path?: string;
}

// GET - Ler estrutura de pastas
export async function GET() {
  try {
    const templatesPath = await getTemplatesPath();
    const verificationPath = path.join(templatesPath, '_verification');
    
    if (!await fs.pathExists(verificationPath)) {
      return NextResponse.json([]);
    }

    const folders = await readFolderStructure(verificationPath);
    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao ler estrutura de pastas', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Criar nova pasta
export async function POST(request: NextRequest) {
  try {
    const { parentId, folderName } = await request.json();
    
    // Se não fornecer nome, usar "Nova Pasta" como padrão
    const finalFolderName = folderName || 'Nova Pasta';

    const templatesPath = await getTemplatesPath();
    const verificationPath = path.join(templatesPath, '_verification');
    
    const parentPath = parentId === 'root' 
      ? verificationPath 
      : path.join(verificationPath, parentId);
    
    const newFolderPath = path.join(parentPath, finalFolderName);
    await fs.ensureDir(newFolderPath);
    
    return NextResponse.json({ success: true, path: newFolderPath });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar pasta', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Renomear pasta
export async function PUT(request: NextRequest) {
  try {
    const { folderId, newName } = await request.json();
    
    if (!folderId || !newName) {
      return NextResponse.json({ error: 'ID da pasta e novo nome são obrigatórios' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    const verificationPath = path.join(templatesPath, '_verification');
    const folderPath = path.join(verificationPath, folderId);
    const newPath = path.join(path.dirname(folderPath), newName);
    
    await fs.move(folderPath, newPath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao renomear pasta', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Deletar pasta
export async function DELETE(request: NextRequest) {
  try {
    const { folderId } = await request.json();
    
    if (!folderId) {
      return NextResponse.json({ error: 'ID da pasta é obrigatório' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    const verificationPath = path.join(templatesPath, '_verification');
    const folderPath = path.join(verificationPath, folderId);
    
    await fs.remove(folderPath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar pasta', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Função auxiliar para ler estrutura de pastas
async function readFolderStructure(basePath: string): Promise<FolderStructure[]> {
  const items = await fs.readdir(basePath);
  const folders: FolderStructure[] = [];
  const templates: FolderStructure[] = [];

  // Separar pastas e templates
  for (const item of items) {
    const itemPath = path.join(basePath, item);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      // É uma pasta
      const children = await readFolderStructure(itemPath);
      folders.push({
        id: item,
        name: item,
        type: 'folder',
        isExpanded: true,
        children
      });
    } else if (item.endsWith('.json')) {
      // É um template (arquivo JSON)
      const templateName = await getTemplateNameFromFile(itemPath);
      templates.push({
        id: item.replace('.json', ''),
        name: templateName || item.replace('.json', ''),
        type: 'template',
        path: item,
        syncStatus: 'unknown'
      });
    }
  }

  // Se não há pastas mas há templates, criar uma pasta "Templates" padrão
  if (folders.length === 0 && templates.length > 0) {
    return [{
      id: 'templates',
      name: 'Templates',
      type: 'folder',
      isExpanded: true,
      children: templates
    }];
  }

  // Se há pastas, adicionar templates soltos como filhos da primeira pasta
  if (folders.length > 0 && templates.length > 0) {
    folders[0].children = [...(folders[0].children || []), ...templates];
  }

  return folders;
}

// Obter nome do template do arquivo JSON
async function getTemplateNameFromFile(filePath: string): Promise<string | null> {
  try {
    const json = await fs.readJson(filePath);
    return json.Template?.TemplateName || null;
  } catch {
    return null;
  }
}

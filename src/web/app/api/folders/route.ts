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
    
    if (!await fs.pathExists(templatesPath)) {
      return NextResponse.json({ folders: [] });
    }

    const folders = await readFolderStructure(templatesPath, '');
    return NextResponse.json({ folders });
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
    
    // Validar nome da pasta
    if (folderName && !/^[a-zA-Z0-9_-]+$/.test(folderName)) {
      return NextResponse.json(
        { error: 'Nome da pasta deve conter apenas letras, números, _ ou -' },
        { status: 400 }
      );
    }
    
    // Se não fornecer nome, usar "verification" como padrão
    const finalFolderName = folderName || 'verification';

    const templatesPath = await getTemplatesPath();
    
    const parentPath = (parentId === 'root' || parentId === 'ses-templates')
      ? templatesPath  // Criar diretamente na pasta ses-templates
      : path.join(templatesPath, parentId);
    
    const newFolderPath = path.join(parentPath, finalFolderName);
    
    // Verificar se a pasta já existe
    if (await fs.pathExists(newFolderPath)) {
      return NextResponse.json(
        { error: 'Pasta já existe' },
        { status: 409 }
      );
    }
    
    await fs.ensureDir(newFolderPath);
    
    console.log(`Pasta criada com sucesso: ${newFolderPath}`);
    return NextResponse.json({ success: true, path: newFolderPath });
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pasta', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Renomear pasta ou template
export async function PUT(request: NextRequest) {
  try {
    const { itemId, newName, itemType = 'folder' } = await request.json();
    
    if (!itemId || !newName) {
      return NextResponse.json({ error: 'ID do item e novo nome são obrigatórios' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    
    let itemPath: string;
    let newPath: string;
    
    if (itemType === 'template') {
      // Para templates, renomear o arquivo
      itemPath = path.join(templatesPath, itemId);
      const ext = path.extname(itemId);
      const newFileName = newName + ext;
      newPath = path.join(path.dirname(itemPath), newFileName);
    } else {
      // Para pastas, renomear o diretório
      itemPath = path.join(templatesPath, itemId);
      newPath = path.join(path.dirname(itemPath), newName);
    }
    
    await fs.move(itemPath, newPath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao renomear item', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Deletar pasta ou template
export async function DELETE(request: NextRequest) {
  try {
    const { itemId } = await request.json();
    
    if (!itemId) {
      return NextResponse.json({ error: 'ID do item é obrigatório' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    
    const normalizedItemId = itemId.replace(/\\/g, path.sep);
    const itemPath = path.join(templatesPath, normalizedItemId);
    
    if (!(await fs.pathExists(itemPath))) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    
    await fs.remove(itemPath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar item', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Função auxiliar para ler estrutura de pastas
async function readFolderStructure(basePath: string, relativePath: string = ''): Promise<FolderStructure[]> {
  const items = await fs.readdir(basePath);
  const folders: FolderStructure[] = [];
  const templates: FolderStructure[] = [];

  // Separar pastas e templates
  for (const item of items) {
    const itemPath = path.join(basePath, item);
    const stat = await fs.stat(itemPath);
    
    // Construir o caminho relativo completo para o item
    const fullRelativePath = relativePath ? path.join(relativePath, item) : item;

    if (stat.isDirectory()) {
      // É uma pasta
      const children = await readFolderStructure(itemPath, fullRelativePath);
      folders.push({
        id: fullRelativePath,
        name: item,
        type: 'folder',
        isExpanded: true,
        children
      });
    } else if (item.endsWith('.json')) {
      // É um template (arquivo JSON)
      const templateName = await getTemplateNameFromFile(itemPath);
      templates.push({
        id: fullRelativePath, // Manter a extensão .json no ID
        name: templateName || item.replace('.json', ''),
        type: 'template',
        path: fullRelativePath,
        syncStatus: 'unknown'
      });
    }
  }

  // Retornar pastas e templates separadamente
  // Templates soltos ficam no nível raiz junto com as pastas
  return [...folders, ...templates];
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


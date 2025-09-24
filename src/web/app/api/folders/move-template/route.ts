import { NextRequest, NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import fs from 'fs-extra';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { itemId, newParentId } = await request.json();
    
    if (!itemId || !newParentId) {
      return NextResponse.json({ error: 'ID do item e nova pasta são obrigatórios' }, { status: 400 });
    }

    const templatesPath = await getTemplatesPath();
    
    // Caminho atual do item
    const currentPath = path.join(templatesPath, itemId);
    
    // Caminho da nova pasta pai
    const newParentPath = newParentId === 'ses-templates' 
      ? templatesPath 
      : path.join(templatesPath, newParentId);
    
    // Novo caminho do item
    const itemName = path.basename(itemId);
    const newPath = path.join(newParentPath, itemName);
    
    // Verificar se o item existe
    if (!await fs.pathExists(currentPath)) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    
    // Verificar se a pasta de destino existe
    if (!await fs.pathExists(newParentPath)) {
      return NextResponse.json({ error: 'Pasta de destino não encontrada' }, { status: 404 });
    }
    
    // Verificar se já existe um item com o mesmo nome na pasta de destino
    if (await fs.pathExists(newPath)) {
      return NextResponse.json({ error: 'Já existe um item com este nome na pasta de destino' }, { status: 409 });
    }
    
    // Mover o item
    await fs.move(currentPath, newPath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao mover item', details: (error as Error).message },
      { status: 500 }
    );
  }
}
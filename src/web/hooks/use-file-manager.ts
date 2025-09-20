'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'template';
  path: string;
  isExpanded?: boolean;
  children?: FileSystemItem[];
  parentId?: string;
  lastModified?: string;
  size?: number;
}

export interface FileSystemState {
  items: FileSystemItem[];
  isLoading: boolean;
  error: string | null;
}

export function useFileManager() {
  const [state, setState] = useState<FileSystemState>({
    items: [],
    isLoading: true,
    error: null
  });

  // Carregar estrutura de arquivos
  const loadFileSystem = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Buscar estrutura completa de pastas e templates
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error('Erro ao carregar estrutura de arquivos');
      }
      const data = await response.json();
      
      // Construir estrutura hierárquica
      const rootItem: FileSystemItem = {
        id: 'ses-templates',
        name: 'ses-templates',
        type: 'folder',
        path: 'ses-templates',
        isExpanded: true,
        children: []
      };

      // Converter dados da API para FileSystemItem
      const items: FileSystemItem[] = data.folders.map((item: { id: string; name: string; type: 'folder' | 'template'; path?: string; isExpanded?: boolean; children?: { id: string; name: string; type: 'folder' | 'template'; path?: string }[] }) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        path: item.path || item.name,
        isExpanded: item.isExpanded || false,
        children: item.children ? item.children.map((child: { id: string; name: string; type: 'folder' | 'template'; path?: string }) => ({
          id: child.id,
          name: child.name,
          type: child.type,
          path: child.path || child.name,
          parentId: item.id
        })) : [],
        parentId: 'ses-templates'
      }));

      rootItem.children = items;
      
      setState({
        items: [rootItem],
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
      setState({
        items: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar arquivos'
      });
    }
  }, []);

  // Inicializar
  useEffect(() => {
    loadFileSystem();
  }, [loadFileSystem]);

  // Toggle expandir/colapsar pasta
  const toggleFolder = useCallback((folderId: string) => {
    console.log('Toggle folder chamado com ID:', folderId);
    setState(prev => {
      const updateItems = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.id === folderId && item.type === 'folder') {
            console.log('Encontrou pasta para toggle:', item.id, 'novo estado:', !item.isExpanded);
            return { ...item, isExpanded: !item.isExpanded };
          }
          if (item.children) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };
      const newItems = updateItems(prev.items);
      return { ...prev, items: newItems };
    });
  }, []);

  // Criar pasta
  const createFolder = useCallback(async (parentId: string, folderName: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, folderName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar pasta');
      }

      await loadFileSystem();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao criar pasta'
      }));
    }
  }, [loadFileSystem]);

  // Criar template
  const createTemplate = useCallback(async (parentId: string, templateName: string) => {
    try {
      const response = await fetch('/api/folders/create-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          folderId: parentId, 
          templateName,
          templateType: 'verification'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar template');
      }

      await loadFileSystem();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao criar template'
      }));
    }
  }, [loadFileSystem]);

  // Renomear item
  const renameItem = useCallback(async (itemId: string, newName: string, itemType: 'folder' | 'template' = 'folder') => {
    try {
      const response = await fetch('/api/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, newName, itemType })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao renomear item');
      }

      await loadFileSystem();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao renomear item'
      }));
    }
  }, [loadFileSystem]);

  // Deletar item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar item');
      }

      await loadFileSystem();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao deletar item'
      }));
    }
  }, [loadFileSystem]);

  return {
    ...state,
    toggleFolder,
    createFolder,
    createTemplate,
    renameItem,
    deleteItem,
    refresh: loadFileSystem
  };
}

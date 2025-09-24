'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

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
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
}

interface ApiFolderItem {
  id: string;
  name: string;
  type: 'folder' | 'template';
  path?: string;
  isExpanded?: boolean;
  children?: ApiFolderItem[];
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
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

  // Buscar dados de sincronização
  const { data: syncData, error: syncError } = useSWR('/api/verification-templates/sync-status');
  
  console.log('SyncData recebido:', syncData);
  console.log('SyncError:', syncError);

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

      // Função recursiva para converter dados da API
      const convertToFileSystemItem = (item: ApiFolderItem, parentId: string = 'ses-templates'): FileSystemItem => {
        console.log('Convertendo item:', item.name, 'tipo:', item.type);
        
        // Buscar status de sincronização nos dados de sync
        let syncStatus: 'synced' | 'modified' | 'new_local' | 'unknown' = 'unknown';
        
        if (syncData && item.type === 'template') {
          console.log('Comparando template local:', item.name, 'com dados remotos');
          
          // Verificar se existe nos templates remotos
          const existsInRemote = syncData.remoteOnly?.some((remote: { TemplateName: string }) => 
            remote.TemplateName === item.name.replace('.verification.json', '')
          );
          
          // Verificar se existe na árvore local (já processada)
          const existsInLocal = syncData.localTree?.some((local: { name: string }) => 
            local.name === item.name.replace('.verification.json', '')
          );
          
          console.log('Existe no remoto:', existsInRemote, 'Existe no local:', existsInLocal);
          
          if (existsInRemote && existsInLocal) {
            syncStatus = 'synced';
          } else if (existsInLocal && !existsInRemote) {
            syncStatus = 'new_local';
          } else if (!existsInLocal && existsInRemote) {
            syncStatus = 'unknown'; // Template só existe no remoto
          } else {
            syncStatus = 'unknown';
          }
          
          console.log('Status determinado:', syncStatus);
        } else if (item.type === 'template') {
          // Fallback: se não há dados de sync, assumir 'new_local' para templates existentes
          console.log('Sem dados de sync, assumindo new_local para:', item.name);
          syncStatus = 'new_local';
        }

        return {
          id: item.id,
          name: item.name,
          type: item.type,
          path: item.path || item.name,
          isExpanded: item.isExpanded || false,
          children: item.children ? item.children.map((child: ApiFolderItem) => convertToFileSystemItem(child, item.id)) : [],
          parentId,
          syncStatus
        };
      };

      // Converter dados da API para FileSystemItem
      const items: FileSystemItem[] = data.folders.map((item: ApiFolderItem) => convertToFileSystemItem(item));

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
  }, [syncData]);

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
      console.log('Deletando item com ID:', itemId);
      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro na API:', error);
        throw new Error(error.error || 'Erro ao deletar item');
      }

      console.log('Item deletado com sucesso');
      await loadFileSystem();
    } catch (err) {
      console.error('Erro ao deletar:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao deletar item'
      }));
    }
  }, [loadFileSystem]);

  // Mover item
  const moveItem = useCallback(async (itemId: string, newParentId: string) => {
    try {
      console.log('Movendo item:', itemId, 'para pasta:', newParentId);
      const response = await fetch('/api/folders/move-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, newParentId })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro na API:', error);
        throw new Error(error.error || 'Erro ao mover item');
      }

      console.log('Item movido com sucesso');
      await loadFileSystem();
    } catch (err) {
      console.error('Erro ao mover:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao mover item'
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
    moveItem,
    refresh: loadFileSystem
  };
}

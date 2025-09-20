'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FolderStructure {
  id: string;
  name: string;
  type: 'folder' | 'template';
  children?: FolderStructure[];
  isExpanded?: boolean;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
  path?: string;
}

export function useFolderManager() {
  const [folders, setFolders] = useState<FolderStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar estrutura de pastas
  const loadFolders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/folders');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar pastas');
      }
      
      const data = await response.json();
      setFolders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pastas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicializar
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Recarregar estrutura de pastas
  const refreshFolders = useCallback(async () => {
    await loadFolders();
  }, [loadFolders]);

  // Criar nova pasta
  const createFolder = useCallback(async (parentId: string, folderName?: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, folderName: folderName || 'Nova Pasta' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar pasta');
      }

      await refreshFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pasta');
    }
  }, [refreshFolders]);

  // Mover template entre pastas
  const moveTemplate = useCallback(async (templateId: string, fromFolderId: string, toFolderId: string) => {
    try {
      const response = await fetch('/api/folders/move-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, fromFolderId, toFolderId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao mover template');
      }

      await refreshFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover template');
    }
  }, [refreshFolders]);

  // Renomear pasta
  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, newName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao renomear pasta');
      }

      await refreshFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renomear pasta');
    }
  }, [refreshFolders]);

  // Deletar pasta
  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar pasta');
      }

      await refreshFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar pasta');
    }
  }, [refreshFolders]);

  // Criar template
  const createTemplate = useCallback(async (folderId: string, templateName: string) => {
    try {
      const response = await fetch('/api/folders/create-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, templateName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar template');
      }

      await refreshFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template');
    }
  }, [refreshFolders]);

  // Toggle expandir/colapsar pasta
  const toggleFolder = useCallback((folderId: string) => {
    const toggleRecursive = (items: FolderStructure[]): FolderStructure[] => {
      return items.map(item => {
        if (item.id === folderId) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        if (item.children) {
          return { ...item, children: toggleRecursive(item.children) };
        }
        return item;
      });
    };
    setFolders(toggleRecursive(folders));
  }, [folders]);

  return {
    folders,
    isLoading,
    error,
    refreshFolders,
    createFolder,
    moveTemplate,
    renameFolder,
    deleteFolder,
    createTemplate,
    toggleFolder
  };
}

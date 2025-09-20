'use client';

import { useState, useEffect } from 'react';
import { useFolderManager } from './use-folder-manager';
import { useLocalTemplates } from './use-local-templates';

export interface HierarchicalItem {
  id: string;
  name: string;
  type: 'folder' | 'template';
  isExpanded?: boolean;
  children?: HierarchicalItem[];
  parentId?: string;
}

export function useHierarchicalFolders() {
  const { folders, createFolder, createTemplate, isLoading, error } = useFolderManager();
  const { templates } = useLocalTemplates();
  const [hierarchicalItems, setHierarchicalItems] = useState<HierarchicalItem[]>([]);

  // Converter estrutura de pastas para hierárquica
  useEffect(() => {
    const buildHierarchy = (): HierarchicalItem[] => {
      // Criar root "ses-templates"
      const rootItem: HierarchicalItem = {
        id: 'ses-templates',
        name: 'ses-templates',
        type: 'folder',
        isExpanded: true,
        children: []
      };

      // Adicionar pastas como filhos do root
      const folderItems: HierarchicalItem[] = folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        isExpanded: false,
        children: [],
        parentId: 'ses-templates'
      }));

      // Adicionar templates locais como filhos do root
      const templateItems: HierarchicalItem[] = templates.map(template => ({
        id: `template-${template.path}`,
        name: template.name,
        type: 'template',
        parentId: 'ses-templates'
      }));

      // Adicionar todos os itens como filhos do root
      rootItem.children = [...folderItems, ...templateItems];

      return [rootItem];
    };

    setHierarchicalItems(buildHierarchy());
  }, [folders, templates]);

  const toggleFolder = (folderId: string) => {
    setHierarchicalItems(prev => {
      const updateItems = (items: HierarchicalItem[]): HierarchicalItem[] => {
        return items.map(item => {
          if (item.id === folderId && item.type === 'folder') {
            return { ...item, isExpanded: !item.isExpanded };
          }
          if (item.children) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };
      return updateItems(prev);
    });
  };

  const handleCreateFolder = async (parentId: string) => {
    const folderName = `Nova Pasta ${Date.now()}`;
    await createFolder(parentId, folderName);
  };

  const handleCreateTemplate = async (parentId: string) => {
    const templateName = `Novo Template ${Date.now()}`;
    await createTemplate(parentId, templateName);
  };

  return {
    items: hierarchicalItems,
    isLoading,
    error,
    toggleFolder,
    createFolder: handleCreateFolder,
    createTemplate: handleCreateTemplate
  };
}

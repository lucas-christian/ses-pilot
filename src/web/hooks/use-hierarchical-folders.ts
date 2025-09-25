'use client';

import { useState, useEffect } from 'react';
import { useFileManager } from './use-file-manager';
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
  // const { folders, createFolder, createTemplate, isLoading, error } = useFileManager();
  const { templates, isLoading, error } = useFileManager();
  const { templates: localTemplates } = useLocalTemplates();
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

      // Adicionar pastas como filhos do root (por enquanto vazio até implementar folders)
      const folderItems: HierarchicalItem[] = [];

      // Adicionar templates locais como filhos do root
      const templateItems: HierarchicalItem[] = templates.map((template: { id: string; name: string; path: string }) => ({
        id: `template-${template.path || template.id}`,
        name: template.name,
        type: 'template',
        parentId: 'ses-templates'
      }));

      // Adicionar templates locais também
      const localTemplateItems: HierarchicalItem[] = localTemplates.map((template) => ({
        id: `local-template-${template.path}`,
        name: template.name,
        type: 'template',
        parentId: 'ses-templates'
      }));

      // Adicionar todos os itens como filhos do root
      rootItem.children = [...folderItems, ...templateItems, ...localTemplateItems];

      return [rootItem];
    };

    setHierarchicalItems(buildHierarchy());
  }, [localTemplates, templates]);

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
    // await createFolder(parentId, folderName);
    console.log('Create folder not implemented:', parentId, folderName);
  };

  const handleCreateTemplate = async (parentId: string) => {
    const templateName = `Novo Template ${Date.now()}`;
    // await createTemplate(parentId, templateName);
    console.log('Create template not implemented:', parentId, templateName);
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

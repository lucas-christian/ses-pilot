'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Plus,
  FolderPlus,
  MoreHorizontal
} from 'lucide-react';

interface FolderTreeItemProps {
  item: {
    id: string;
    name: string;
    type: 'folder' | 'template';
    isExpanded?: boolean;
    children?: FolderTreeItemProps['item'][];
  };
  level?: number;
  onFolderToggle?: (folderId: string) => void;
  onFolderContextMenu?: (e: React.MouseEvent, folderId: string) => void;
  onTemplateClick?: (template: { id: string; name: string; path?: string; type: string }) => void;
  onCreateFolder?: (parentId: string) => void;
  onCreateTemplate?: (parentId: string) => void;
}

export function FolderTreeItem({ 
  item, 
  level = 0, 
  onFolderToggle, 
  onFolderContextMenu,
  onTemplateClick,
  onCreateFolder,
  onCreateTemplate
}: FolderTreeItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isFolder = item.type === 'folder';
  const hasChildren = isFolder && item.children && item.children.length > 0;

  const handleClick = () => {
    if (isFolder && onFolderToggle) {
      onFolderToggle(item.id);
    } else if (!isFolder && onTemplateClick) {
      onTemplateClick({
        id: item.id,
        name: item.name,
        type: item.type
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFolderContextMenu) {
      onFolderContextMenu(e, item.id);
    }
  };

  const handleCreateFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateFolder) {
      onCreateFolder(item.id);
    }
  };

  const handleCreateTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateTemplate) {
      onCreateTemplate(item.id);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded hover:bg-accent/50 transition-colors cursor-pointer group`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Ícone de expansão para pastas */}
        {isFolder && (
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              item.isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </div>
        )}

        {/* Ícone do item */}
        <div className="w-4 h-4 flex items-center justify-center">
          {isFolder ? (
            item.isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Nome do item */}
        <span className="flex-1 text-sm truncate">
          {item.name}
        </span>

        {/* Badge para templates */}
        {!isFolder && (
          <Badge variant="outline" className="text-xs">
            {item.name.endsWith('.verification.json') ? 'Verificação' : 'E-mail'}
          </Badge>
        )}

        {/* Ações (só para pastas) */}
        {isFolder && showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateTemplate}
              className="p-1 h-auto hover:bg-muted/50"
              title="Novo Template"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              className="p-1 h-auto hover:bg-muted/50"
              title="Nova Pasta"
            >
              <FolderPlus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContextMenu}
              className="p-1 h-auto hover:bg-muted/50"
              title="Mais opções"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Ações sempre visíveis para o root */}
        {isFolder && item.id === 'ses-templates' && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateTemplate}
              className="p-1 h-auto hover:bg-muted/50"
              title="Novo Template"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              className="p-1 h-auto hover:bg-muted/50"
              title="Nova Pasta"
            >
              <FolderPlus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContextMenu}
              className="p-1 h-auto hover:bg-muted/50"
              title="Mais opções"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Filhos (recursivo) */}
      {isFolder && item.isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onFolderToggle={onFolderToggle}
              onFolderContextMenu={onFolderContextMenu}
              onTemplateClick={onTemplateClick}
              onCreateFolder={onCreateFolder}
              onCreateTemplate={onCreateTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

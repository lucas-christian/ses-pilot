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
  MoreHorizontal
} from 'lucide-react';

interface FileTreeItemProps {
  item: {
    id: string;
    name: string;
    type: 'folder' | 'template';
    path: string;
    isExpanded?: boolean;
    children?: FileTreeItemProps['item'][];
  };
  level?: number;
  onFolderToggle?: (folderId: string) => void;
  onItemContextMenu?: (e: React.MouseEvent, itemId: string, itemType: 'folder' | 'template') => void;
  onItemClick?: (item: { id: string; name: string; path: string; type: 'folder' | 'template' }) => void;
}

export function FileTreeItem({ 
  item, 
  level = 0, 
  onFolderToggle, 
  onItemContextMenu,
  onItemClick
}: FileTreeItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isFolder = item.type === 'folder';
  const hasChildren = isFolder && item.children && item.children.length > 0;

  const handleClick = () => {
    console.log('FileTreeItem clicked:', { id: item.id, name: item.name, type: item.type, isFolder });
    if (isFolder && onFolderToggle) {
      console.log('Chamando onFolderToggle para:', item.id);
      onFolderToggle(item.id);
    } else if (!isFolder && onItemClick) {
      console.log('Chamando onItemClick para:', item.id);
      onItemClick({
        id: item.id,
        name: item.name,
        path: item.path,
        type: item.type
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onItemContextMenu) {
      onItemContextMenu(e, item.id, item.type);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded hover:bg-accent/50 transition-colors cursor-pointer group`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
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

        {/* Botão de mais opções - apenas para pastas */}
        {isFolder && showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContextMenu}
            className="p-1 h-auto hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mais opções"
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Filhos (recursivo) */}
      {isFolder && item.isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onFolderToggle={onFolderToggle}
              onItemContextMenu={onItemContextMenu}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

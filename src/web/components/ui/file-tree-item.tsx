'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineEditor } from '@/components/ui/inline-editor';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Edit2,
  FolderPlus,
  Plus
} from 'lucide-react';

type InlineAction =
  | { mode: 'create'; parentId: string; type: 'folder' | 'template' }
  | { mode: 'rename'; itemId: string; oldName: string }
  | null;

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
  createFolder?: (parentId: string, name: string) => void;
  createTemplate?: (parentId: string, name: string) => void;
  renameItem?: (itemId: string, newName: string, itemType: 'folder' | 'template') => void;
  deleteItem?: (itemId: string) => void;
  inlineAction?: InlineAction;
  setInlineAction?: (action: InlineAction) => void;
  rootFolderId?: string;
}

export function FileTreeItem({ 
  item, 
  level = 0, 
  onFolderToggle, 
  onItemContextMenu,
  onItemClick,
  createFolder,
  createTemplate,
  renameItem,
  deleteItem,
  inlineAction,
  setInlineAction,
  rootFolderId
}: FileTreeItemProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const isFolder = item.type === 'folder';
  const hasChildren = isFolder && item.children && item.children.length > 0;
  const isExpanded = !!item.isExpanded;

  // Fechar menu de ações quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };

    if (actionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [actionsOpen]);

  const handleRowClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isFolder) {
      onFolderToggle?.(item.id);
    } else {
      onItemClick?.({ id: item.id, name: item.name, path: item.path, type: item.type });
    }
  };

  const openCreate = (type: 'folder' | 'template') => {
    setActionsOpen(false);
    setInlineAction?.({ mode: 'create', parentId: item.id, type });
  };

  const openRename = () => {
    setActionsOpen(false);
    setInlineAction?.({ mode: 'rename', itemId: item.id, oldName: item.name });
  };

  const handleDelete = () => {
    setActionsOpen(false);
    deleteItem?.(item.id);
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
        className="relative flex items-center gap-2 py-1 px-2 rounded hover:bg-accent/50 transition-colors cursor-pointer min-w-0"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleRowClick}
        onContextMenu={handleContextMenu}
      >
        {/* expand icon */}
        {isFolder && (
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
            ) : (
              <div className="w-3 h-3" />
            )}
          </div>
        )}

        {/* item icon */}
        <div className="w-4 h-4 flex items-center justify-center">
          {isFolder ? (isExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />) : <FileText className="w-4 h-4 text-muted-foreground" />}
        </div>

        {/* name or inline rename */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {inlineAction?.mode === 'rename' && inlineAction.itemId === item.id ? (
            <InlineEditor
              initialValue={inlineAction.oldName}
              placeholder="Renomear..."
              onCancel={() => setInlineAction?.(null)}
              onSubmit={(newName) => {
                const trimmed = newName.trim();
                if (!trimmed) {
                  setInlineAction?.(null);
                  return;
                }
                renameItem?.(item.id, trimmed, item.type);
                setInlineAction?.(null);
              }}
            />
          ) : (
            <span className="text-sm truncate block">{item.name}</span>
          )}
        </div>

        {/* badge */}
        {!isFolder && (
          <Badge variant="outline" className="text-xs mr-1">
            {item.name.endsWith('.verification.json') ? 'Verificação' : 'E-mail'}
          </Badge>
        )}

        {/* actions button (visible on hover) */}
        <div className="relative flex-shrink-0" ref={actionsRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setActionsOpen((s) => !s); }}
            className="p-1 rounded hover:bg-muted/50 flex-shrink-0"
            title="Ações"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {actionsOpen && (
            <div
              className="absolute right-0 mt-1 bg-background border rounded shadow p-1 z-50"
              onClick={(e) => e.stopPropagation()}
              style={{ minWidth: 160 }}
            >
              {/* create only for folders */}
              {isFolder && (
                <>
                  <button
                    className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-muted/50 rounded"
                    onClick={() => openCreate('folder')}
                  >
                    <FolderPlus className="w-4 h-4" /> Nova pasta
                  </button>

                  <button
                    className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-muted/50 rounded"
                    onClick={() => openCreate('template')}
                  >
                    <Plus className="w-4 h-4" /> Novo template
                  </button>

                  <div className="border-t my-1" />
                </>
              )}

              {/* Renomear sempre disponível, deletar apenas se não for a pasta raiz */}
              <button className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-muted/50 rounded" onClick={openRename}>
                <Edit2 className="w-4 h-4" /> Renomear
              </button>

              {item.id !== rootFolderId && (
                <button className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-destructive/10 rounded text-destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" /> Deletar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* inline create inside this folder (rendered as a child row) */}
      {inlineAction?.mode === 'create' && inlineAction.parentId === item.id && (
        <div style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }} className="mb-1">
          <InlineEditor
            initialValue=""
            placeholder={inlineAction.type === 'folder' ? 'Nome da pasta' : 'Nome do template'}
            onCancel={() => setInlineAction?.(null)}
            onSubmit={(name) => {
              const trimmed = name.trim();
              if (!trimmed) {
                setInlineAction?.(null);
                return;
              }
              if (inlineAction.type === 'folder') createFolder?.(item.id, trimmed);
              else createTemplate?.(item.id, trimmed);
              setInlineAction?.(null);
            }}
          />
        </div>
      )}

      {/* children recursion */}
      {isFolder && isExpanded && item.children?.map((child) => (
        <FileTreeItem
          key={child.id}
          item={child}
          level={level + 1}
          onFolderToggle={onFolderToggle}
          onItemClick={onItemClick}
          createFolder={createFolder}
          createTemplate={createTemplate}
          renameItem={renameItem}
          deleteItem={deleteItem}
          inlineAction={inlineAction}
          setInlineAction={setInlineAction}
          rootFolderId={rootFolderId}
        />
      ))}
    </div>
  );
}

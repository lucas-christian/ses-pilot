'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { InlineEditor } from '@/components/ui/inline-editor';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { useDraggable, useDroppable } from '@dnd-kit/core';
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
  Plus,
  GripVertical
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
    syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
  };
  level?: number;
  onFolderToggle?: (folderId: string) => void;
  onItemContextMenu?: (e: React.MouseEvent, itemId: string, itemType: 'folder' | 'template') => void;
  onItemClick?: (item: { id: string; name: string; path: string; type: 'folder' | 'template' }) => void;
  createFolder?: (parentId: string, name: string) => void;
  createTemplate?: (parentId: string, name: string) => void;
  renameItem?: (itemId: string, newName: string, itemType: 'folder' | 'template') => void;
  deleteItem?: (itemId: string) => void;
  moveItem?: (itemId: string, newParentId: string) => void;
  inlineAction?: InlineAction;
  setInlineAction?: (action: InlineAction) => void;
  rootFolderId?: string;
}

function SyncStatusIndicator({ status }: { status?: 'synced' | 'modified' | 'new_local' | 'unknown' }) {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  
  if (!status) return null;
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'outline'; title: string }> = {
    synced: { variant: 'default', title: t('templates.syncStatus.synced') },
    modified: { variant: 'secondary', title: t('templates.syncStatus.modified') },
    new_local: { variant: 'outline', title: t('templates.syncStatus.new_local') },
    unknown: { variant: 'outline', title: t('templates.syncStatus.unknown') },
  };
  const { variant, title } = statusMap[status] || statusMap.unknown;
  return <Badge variant={variant} className="text-xs">{title}</Badge>;
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
  moveItem,
  inlineAction,
  setInlineAction,
  rootFolderId
}: FileTreeItemProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const isFolder = item.type === 'folder';
  const hasChildren = isFolder && item.children && item.children.length > 0;
  const isExpanded = !!item.isExpanded;

  // Drag and drop - não permitir drag da pasta root
  const canDrag = item.id !== rootFolderId;
  
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: item.id,
    disabled: !canDrag,
    data: {
      type: item.type,
      name: item.name,
      path: item.path,
    },
  });

  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({
    id: item.id,
    data: {
      type: item.type,
      accepts: ['folder', 'template'],
    },
  });

  const canDrop = active && active.id !== item.id && isFolder;
  const isBeingDragged = isDragging;

  // Handle drop
  useEffect(() => {
    if (isOver && canDrop && active && moveItem) {
      const draggedItemId = active.id as string;
      const targetFolderId = item.id;
      
      if (draggedItemId !== targetFolderId) {
        console.log('Movendo item:', draggedItemId, 'para pasta:', targetFolderId);
        moveItem(draggedItemId, targetFolderId);
      }
    }
  }, [isOver, canDrop, active, moveItem, item.id]);

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
        ref={(node) => {
          setDragRef(node);
          setDropRef(node);
        }}
        className={`relative flex items-center gap-2 py-1 px-2 rounded transition-all duration-200 cursor-pointer min-w-0 ${
          isBeingDragged ? 'opacity-30 scale-95 shadow-lg' : ''
        } ${
          canDrop && isOver ? 'bg-blue-100 border-2 border-blue-400 border-dashed shadow-md scale-105' : 'hover:bg-accent/50'
        } ${
          !canDrag ? 'cursor-default' : ''
        }`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={handleRowClick}
        onContextMenu={handleContextMenu}
        {...attributes}
        {...listeners}
      >
        {/* drag handle - só aparece se pode ser arrastado */}
        {canDrag && (
          <div className="w-4 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted/50 rounded">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
        
        {/* espaço vazio se não pode ser arrastado */}
        {!canDrag && <div className="w-4 h-4" />}

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
            <span className={`text-sm truncate block ${canDrop && isOver ? 'font-semibold text-blue-600' : ''}`}>
              {item.name}
              {canDrop && isOver && (
                <span className="ml-2 text-xs text-blue-500">← Soltar aqui</span>
              )}
            </span>
          )}
        </div>

        {/* badge */}
        {!isFolder && (
          <div className="flex items-center gap-1 mr-1">
            <SyncStatusIndicator status={item.syncStatus} />
          </div>
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
        <div style={{ paddingLeft: `${(level + 1) * 24 + 8}px` }} className="mb-1">
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
          moveItem={moveItem}
          inlineAction={inlineAction}
          setInlineAction={setInlineAction}
          rootFolderId={rootFolderId}
        />
      ))}
    </div>
  );
}

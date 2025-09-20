'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Mail,
  GripVertical,
  PlusCircle
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'template';
  children?: FolderItem[];
  isExpanded?: boolean;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
  path?: string;
}

interface FolderTreeProps {
  folders: FolderItem[];
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
  onTemplateMove: (templateId: string, fromFolderId: string, toFolderId: string) => void;
  onTemplateClick: (template: FolderItem) => void;
  onCreateFolder: (parentId: string, name: string) => void;
  onCreateTemplate: (parentId: string) => void;
}

function SortableItem({ item, level = 0, onFolderToggle, onFolderRename, onFolderDelete, onTemplateClick, onCreateFolder, onCreateTemplate }: {
  item: FolderItem;
  level?: number;
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
  onTemplateClick: (template: FolderItem) => void;
  onCreateFolder: (parentId: string, name: string) => void;
  onCreateTemplate: (parentId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const handleRename = () => {
    if (editName.trim() && editName !== item.name) {
      onFolderRename(item.id, editName.trim());
    }
    setIsEditing(false);
    setEditName(item.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(item.name);
    }
  };

  const isFolder = item.type === 'folder';
  const Icon = isFolder ? (item.isExpanded ? FolderOpen : Folder) : Mail;

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 p-1 rounded-md hover:bg-accent/50 transition-colors ${
        isDragging ? 'bg-accent/20' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{ 
        paddingLeft: `${level * 1.5}rem`,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Toggle Button */}
      {isFolder && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFolderToggle(item.id)}
          className="p-0 h-auto w-4 hover:bg-transparent"
        >
          <ChevronDown 
            className={`w-3 h-3 transition-transform duration-200 ${
              item.isExpanded ? 'rotate-0' : '-rotate-90'
            }`} 
          />
        </Button>
      )}

      {/* Icon */}
      <Icon className="w-4 h-4 flex-shrink-0" />

      {/* Name */}
      {isEditing ? (
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm"
          autoFocus
        />
      ) : (
        <span 
          className="flex-1 text-sm truncate cursor-pointer"
          onClick={() => isFolder ? onFolderToggle(item.id) : onTemplateClick(item)}
        >
          {item.name}
        </span>
      )}

      {/* Badge */}
      {!isFolder && item.syncStatus && (
        <Badge variant="outline" className="text-xs">
          {item.syncStatus}
        </Badge>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1">
          {isFolder && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateTemplate(item.id)}
                className="p-1 h-auto hover:bg-muted/50"
                title="Novo Template"
              >
                <PlusCircle className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateFolder(item.id, 'Nova Pasta')}
                className="p-1 h-auto hover:bg-muted/50"
                title="Nova Pasta"
              >
                <Folder className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-1 h-auto hover:bg-muted/50"
                title="Renomear"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFolderDelete(item.id)}
                className="p-1 h-auto hover:bg-destructive/20 text-destructive"
                title="Deletar"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Children */}
      {isFolder && item.isExpanded && item.children && (
        <div className="w-full">
          {item.children.map((child) => (
            <SortableItem
              key={child.id}
              item={child}
              level={level + 1}
              onFolderToggle={onFolderToggle}
              onFolderRename={onFolderRename}
              onFolderDelete={onFolderDelete}
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

export function FolderTree({ 
  folders, 
  onFolderToggle, 
  onFolderRename, 
  onFolderDelete, 
  onTemplateMove,
  onTemplateClick,
  onCreateFolder,
  onCreateTemplate
}: FolderTreeProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which folder the template is currently in
    const findParent = (items: FolderItem[], targetId: string): string | null => {
      for (const item of items) {
        if (item.children?.some(child => child.id === targetId)) {
          return item.id;
        }
        if (item.children) {
          const found = findParent(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const currentParent = findParent(folders, activeId);
    
    if (currentParent && currentParent !== overId) {
      onTemplateMove(activeId, currentParent, overId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which folder the template is currently in
    const findParent = (items: FolderItem[], targetId: string): string | null => {
      for (const item of items) {
        if (item.children?.some(child => child.id === targetId)) {
          return item.id;
        }
        if (item.children) {
          const found = findParent(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const currentParent = findParent(folders, activeId);
    const targetFolder = folders.find(f => f.id === overId);
    
    if (targetFolder && currentParent && targetFolder.id !== currentParent) {
      // Auto-expand target folder when dragging over it
      if (!targetFolder.isExpanded) {
        onFolderToggle(targetFolder.id);
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-1">
        <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {folders.map((folder) => (
            <SortableItem
              key={folder.id}
              item={folder}
              onFolderToggle={onFolderToggle}
              onFolderRename={onFolderRename}
              onFolderDelete={onFolderDelete}
              onTemplateClick={onTemplateClick}
              onCreateFolder={onCreateFolder}
              onCreateTemplate={onCreateTemplate}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

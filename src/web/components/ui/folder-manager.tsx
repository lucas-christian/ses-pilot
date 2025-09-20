'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Folder, 
  FolderOpen, 
  Edit2, 
  Trash2, 
  GripVertical,
  Mail,
  FolderPlus
} from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  templates: string[];
  isExpanded: boolean;
  color?: string;
}

interface Template {
  id: string;
  name: string;
  path: string;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
}

interface FolderManagerProps {
  templates: Template[];
  onTemplateMove?: (templateId: string, folderId: string) => void;
  onFolderCreate?: (name: string) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
}

function SortableTemplate({ template }: { template: Template }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors ${
        isDragging ? 'bg-accent/20' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground" />
      <Mail className="w-4 h-4 text-muted-foreground" />
      <span className="flex-1 text-sm truncate">{template.name}</span>
      {template.syncStatus && (
        <Badge variant="outline" className="text-xs">
          {template.syncStatus}
        </Badge>
      )}
    </div>
  );
}

function SortableFolder({ folder, templates, onFolderRename, onFolderDelete }: {
  folder: Folder;
  templates: Template[];
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const folderTemplates = templates.filter(t => folder.templates.includes(t.id));

  const handleRename = () => {
    if (editName.trim() && editName !== folder.name) {
      onFolderRename?.(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <Card className="border-0 bg-muted/20">
      <CardContent className="p-3">
        {/* Folder Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Toggle folder expansion - this would be handled by parent component
              }}
              className="p-1 h-auto"
            >
              {folder.isExpanded ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
            </Button>
            
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setEditName(folder.name);
                    setIsEditing(false);
                  }
                }}
                className="h-6 text-sm"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium">{folder.name}</span>
            )}
            
            <Badge variant="secondary" className="text-xs">
              {folderTemplates.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="p-1 h-auto hover:bg-muted/50"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFolderDelete?.(folder.id)}
              className="p-1 h-auto hover:bg-destructive/20 text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Folder Content */}
        {folder.isExpanded && (
          <div className="space-y-1">
            {folderTemplates.length > 0 ? (
              <SortableContext items={folderTemplates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {folderTemplates.map((template) => (
                  <SortableTemplate
                    key={template.id}
                    template={template}
                  />
                ))}
              </SortableContext>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Mail className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Pasta vazia</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FolderManager({ 
  templates, 
  onTemplateMove, 
  onFolderCreate, 
  onFolderRename, 
  onFolderDelete 
}: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load folders from localStorage on mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('verification-folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      // Create default "Geral" folder
      const defaultFolder: Folder = {
        id: 'general',
        name: 'Geral',
        templates: templates.map(t => t.id),
        isExpanded: true,
      };
      setFolders([defaultFolder]);
    }
  }, [templates]);

  // Save folders to localStorage whenever folders change
  useEffect(() => {
    localStorage.setItem('verification-folders', JSON.stringify(folders));
  }, [folders]);

  const handleDragStart = () => {
    // Handle drag start if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're moving a template
    const template = templates.find(t => t.id === activeId);
    if (template) {
      // Find which folder the template is currently in
      const currentFolder = folders.find(f => f.templates.includes(activeId));
      
      // Find which folder we're dropping into
      const targetFolder = folders.find(f => f.id === overId);
      
      if (targetFolder && currentFolder && targetFolder.id !== currentFolder.id) {
        // Move template between folders
        setFolders(prev => prev.map(folder => {
          if (folder.id === currentFolder.id) {
            return {
              ...folder,
              templates: folder.templates.filter(id => id !== activeId)
            };
          }
          if (folder.id === targetFolder.id) {
            return {
              ...folder,
              templates: [...folder.templates, activeId]
            };
          }
          return folder;
        }));
        
        onTemplateMove?.(activeId, targetFolder.id);
      }
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim(),
        templates: [],
        isExpanded: true,
      };
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateDialog(false);
      onFolderCreate?.(newFolderName.trim());
    }
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    ));
    onFolderRename?.(folderId, newName);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder && folder.templates.length > 0) {
      // Move templates to "Geral" folder
      const generalFolder = folders.find(f => f.id === 'general');
      if (generalFolder) {
        setFolders(prev => prev.map(f => 
          f.id === 'general' 
            ? { ...f, templates: [...f.templates, ...folder.templates] }
            : f.id === folderId ? { ...f, templates: [] } : f
        ));
      }
    }
    setFolders(prev => prev.filter(f => f.id !== folderId));
    onFolderDelete?.(folderId);
  };

  return (
    <div className="space-y-3">
      {/* Header with Create Folder Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Organização</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-auto hover:bg-muted/50">
              <FolderPlus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Pasta</DialogTitle>
              <DialogDescription>
                Digite o nome da nova pasta para organizar seus templates.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nome da pasta"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Criar Pasta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2">
          {folders.map((folder) => (
            <SortableFolder
              key={folder.id}
              folder={folder}
              templates={templates}
              onFolderRename={handleRenameFolder}
              onFolderDelete={handleDeleteFolder}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

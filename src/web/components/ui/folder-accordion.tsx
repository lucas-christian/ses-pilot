'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Mail,
  GripVertical
} from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  templates: string[];
  isExpanded: boolean;
}

interface Template {
  id: string;
  name: string;
  path: string;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
}

interface FolderAccordionProps {
  folders: Folder[];
  templates: Template[];
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
  onTemplateClick: (template: Template) => void;
  onTemplateMove: (templateId: string, fromFolderId: string, toFolderId: string) => void;
}

function SortableTemplate({ template, onTemplateClick }: { template: Template; onTemplateClick: (template: Template) => void }) {
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
      className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${
        isDragging ? 'bg-accent/20' : ''
      }`}
      onClick={() => onTemplateClick(template)}
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

export function FolderAccordion({ 
  folders, 
  templates, 
  onFolderToggle, 
  onFolderRename, 
  onFolderDelete, 
  onTemplateClick,
  onTemplateMove
}: FolderAccordionProps) {
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleRename = (folderId: string) => {
    if (editName.trim()) {
      onFolderRename(folderId, editName.trim());
      setEditingFolder(null);
      setEditName('');
    }
  };

  const startEditing = (folder: Folder) => {
    setEditingFolder(folder.id);
    setEditName(folder.name);
  };

  const handleDragStart = () => {
    // Handle drag start if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which folder the template is currently in
    const currentFolder = folders.find(f => f.templates.includes(activeId));
    
    // Check if we're dropping on a folder
    const targetFolder = folders.find(f => f.id === overId);
    
    if (targetFolder && currentFolder && targetFolder.id !== currentFolder.id) {
      onTemplateMove(activeId, currentFolder.id, targetFolder.id);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which folder the template is currently in
    const currentFolder = folders.find(f => f.templates.includes(activeId));
    const targetFolder = folders.find(f => f.id === overId);
    
    if (targetFolder && currentFolder && targetFolder.id !== currentFolder.id) {
      // Auto-expand target folder when dragging over it
      if (!targetFolder.isExpanded) {
        onFolderToggle(targetFolder.id);
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        {folders.map((folder) => {
          const folderTemplates = templates.filter(t => folder.templates.includes(t.id));
          const isEditing = editingFolder === folder.id;

          return (
            <Card key={folder.id} className="border-0 bg-muted/20">
              <CardContent className="p-3">
                {/* Folder Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFolderToggle(folder.id)}
                      className="p-1 h-auto hover:bg-muted/50"
                    >
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          folder.isExpanded ? 'rotate-0' : '-rotate-90'
                        }`} 
                      />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFolderToggle(folder.id)}
                      className="p-1 h-auto hover:bg-muted/50"
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
                        onBlur={() => handleRename(folder.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(folder.id);
                          if (e.key === 'Escape') {
                            setEditingFolder(null);
                            setEditName('');
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
                  
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(folder)}
                        className="p-1 h-auto hover:bg-muted/50"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFolderDelete(folder.id)}
                        className="p-1 h-auto hover:bg-destructive/20 text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Folder Content */}
                {folder.isExpanded && (
                  <div className="space-y-1">
                    {folderTemplates.length > 0 ? (
                      <SortableContext items={folderTemplates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {folderTemplates.map((template) => (
                            <SortableTemplate
                              key={template.id}
                              template={template}
                              onTemplateClick={onTemplateClick}
                            />
                          ))}
                        </div>
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
        })}
      </div>
    </DndContext>
  );
}

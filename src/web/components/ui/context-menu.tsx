'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FolderPlus, 
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, data?: { name?: string; templateId?: string; folderId?: string }) => void;
  isRoot?: boolean;
}

export function ContextMenu({ isOpen, position, onClose, onAction, isRoot = false }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleCreateFolder = () => {
    onAction('create-folder', { name: 'Nova Pasta' });
    onClose();
  };

  const handleCreateTemplate = () => {
    onAction('create-template', { name: 'Novo Template' });
    onClose();
  };

  const handleRename = () => {
    onAction('rename-folder', { name: 'Renomear' });
    onClose();
  };

  const handleDelete = () => {
    onAction('delete-folder', { name: 'Deletar' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border rounded-md shadow-lg py-1 min-w-48"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
        Criar Novo
      </div>
      
      <div className="py-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-8 px-2"
          onClick={handleCreateFolder}
        >
          <FolderPlus className="w-3 h-3 mr-2" />
          Nova Pasta
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-8 px-2"
          onClick={handleCreateTemplate}
        >
          <Plus className="w-3 h-3 mr-2" />
          Novo Template
        </Button>

        {/* Opções adicionais apenas para pastas não-root */}
        {!isRoot && (
          <>
            <div className="border-t border-muted my-1" />
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 px-2"
              onClick={handleRename}
            >
              <Edit2 className="w-3 h-3 mr-2" />
              Renomear
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Deletar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

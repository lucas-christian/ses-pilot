'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Folder, 
  FolderPlus, 
  Move
} from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, data?: { name?: string; templateId?: string; folderId?: string }) => void;
  folders: Array<{ id: string; name: string; templates: string[] }>;
  templateId?: string;
}

export function ContextMenu({ isOpen, position, onClose, onAction, folders, templateId }: ContextMenuProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
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
    console.log('handleCreateFolder called with:', newFolderName);
    if (newFolderName.trim()) {
      console.log('Calling onAction with:', { action: 'create-folder', name: newFolderName.trim() });
      onAction('create-folder', { name: newFolderName.trim() });
      setNewFolderName('');
      setShowCreateDialog(false);
      onClose();
    }
  };

  const handleMoveTemplate = (folderId: string) => {
    onAction('move-template', { templateId, folderId });
    setShowMoveDialog(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-background border rounded-md shadow-lg py-1 min-w-48"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
          Organizar Templates
        </div>
        
        <div className="py-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8 px-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <FolderPlus className="w-3 h-3 mr-2" />
            Nova Pasta
          </Button>
          
          {templateId && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 px-2"
              onClick={() => setShowMoveDialog(true)}
            >
              <Move className="w-3 h-3 mr-2" />
              Mover para Pasta
            </Button>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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

      {/* Move Template Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Template</DialogTitle>
            <DialogDescription>
              Escolha a pasta de destino para este template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleMoveTemplate(folder.id)}
              >
                <Folder className="w-4 h-4 mr-2" />
                {folder.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {folder.templates.length}
                </span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

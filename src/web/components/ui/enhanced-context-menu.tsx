'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FolderPlus, 
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

interface EnhancedContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, data?: { name?: string; itemId?: string; itemType?: string }) => void;
  itemType?: 'folder' | 'template';
  isRoot?: boolean;
}

export function EnhancedContextMenu({ 
  isOpen, 
  position, 
  onClose, 
  onAction, 
  itemType,
  isRoot = false 
}: EnhancedContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [inputAction, setInputAction] = useState<string>('');

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

  const handleAction = (action: string, requiresInput = false) => {
    if (requiresInput) {
      setInputAction(action);
      setShowInput(true);
      setInputValue('');
    } else {
      onAction(action);
      onClose();
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      onAction(inputAction, { name: inputValue.trim() });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue('');
    }
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
      {showInput ? (
        <div className="p-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputAction === 'create-folder' ? 'Nome da pasta (padrão: verification)' : 'Nome do template'}
            className="text-xs h-8"
            autoFocus
          />
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInputSubmit}
              className="text-xs h-6 px-2"
            >
              Criar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInput(false)}
              className="text-xs h-6 px-2"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
            {isRoot ? 'Criar Novo' : itemType === 'folder' ? 'Pasta' : 'Template'}
          </div>
          
          <div className="py-1">
            {/* Opções de criação */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 px-2"
              onClick={() => handleAction('create-folder', true)}
            >
              <FolderPlus className="w-3 h-3 mr-2" />
              Nova Pasta
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 px-2"
              onClick={() => handleAction('create-template', true)}
            >
              <Plus className="w-3 h-3 mr-2" />
              Novo Template
            </Button>

            {/* Opções para itens existentes */}
            {!isRoot && (
              <>
                <div className="border-t border-muted my-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-2"
                  onClick={() => handleAction('rename', true)}
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Renomear
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleAction('delete')}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Deletar
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

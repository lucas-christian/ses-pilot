'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  onInlineEdit?: (action: string, position: { x: number; y: number }) => void;
  isRootFolder?: boolean;
}

export function EnhancedContextMenu({
  isOpen,
  position,
  onClose,
  onAction,
  itemType,
  isRoot = false,
  onInlineEdit,
  isRootFolder = false
}: EnhancedContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        const isContextMenuTrigger = target.closest('[data-context-menu-trigger]');
        if (!isContextMenuTrigger) onClose();
      }
    };

    if (isOpen) {
      // Usar capture: true para interceptar o evento antes
      document.addEventListener('click', handleClickOutside, true);
      return () => document.removeEventListener('click', handleClickOutside, true);
    }
  }, [isOpen, onClose]);

  const handleAction = (action: string, requiresInput = false) => {
    if (requiresInput && onInlineEdit) {
      // Fechar o menu e ativar o inline-editor
      onClose();
      onInlineEdit(action, position);
    } else {
      onAction(action);
      onClose();
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
      {
        <>
          <div className="py-1">
            {/* Opções de criação - apenas para pastas */}
            {itemType === 'folder' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-2"
                  onClick={() => handleAction('create-folder', true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Nova Pasta
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-2"
                  onClick={() => handleAction('create-template', true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>

                <div className="border-t border-muted my-1" />
              </>
            )}

            {/* Renomear sempre disponível */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 px-2"
              onClick={() => handleAction('rename', true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Renomear
            </Button>

            {/* Deletar apenas se não for a pasta raiz */}
            {!isRootFolder && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleAction('delete')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            )}
          </div>
        </>

      }</div>
  );
}

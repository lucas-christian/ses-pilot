'use client';

import { SyncedTemplateNode } from '@/app/api/verification-templates/sync-status/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsDropdown } from '@/components/ui/settings-dropdown';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { AWSTemplatesList } from '@/components/ui/aws-templates-list';
import { LocalTemplatesList } from '@/components/ui/local-templates-list';
import { useFileManager } from '@/hooks/use-file-manager';
import { FileTreeItem } from '@/components/ui/file-tree-item';
import { EnhancedContextMenu } from '@/components/ui/enhanced-context-menu';
import { Mail, Folder, Loader2, ChevronDown, CloudDownload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

function SyncStatusIndicator({ status }: { status: SyncedTemplateNode['syncStatus'] }) {
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

function TemplateNodeView({ node, basePath, level = 0, onContextMenu }: { node: SyncedTemplateNode; basePath: string; level?: number; onContextMenu?: (e: React.MouseEvent, templateId: string) => void }) {
  const pathname = usePathname();
  const href = `${basePath}/${node.relativePath}`;
  const isActive = pathname === href;
  const isFolder = node.type === 'folder';
  const Icon = isFolder ? Folder : Mail;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu && !isFolder) {
      onContextMenu(e, node.relativePath);
    }
  };

  return (
    <div className="w-full">
      <Link href={href} className="block w-full">
        <div 
          className={`flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full ${isActive ? 'bg-accent' : ''}`} 
          style={{ paddingLeft: `${1 + level * 1.5}rem` }}
          onContextMenu={handleContextMenu}
        >
          <div className="flex items-center truncate gap-2 flex-1">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>
          {!isFolder && <SyncStatusIndicator status={node.syncStatus} />}
        </div>
      </Link>
      {isFolder && node.children && (
        <div>{node.children.map((child: SyncedTemplateNode) => <TemplateNodeView key={child.relativePath} node={child} basePath={basePath} level={level + 1} onContextMenu={onContextMenu} />)}</div>
      )}
    </div>
  );
}


function VerificationTemplatesSection() {
  const { 
    items, 
    isLoading, 
    error, 
    toggleFolder, 
    createFolder, 
    createTemplate,
    renameItem,
    deleteItem
  } = useFileManager();
  
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAWSTemplates, setShowAWSTemplates] = useState(false);
  const [showLocalTemplates, setShowLocalTemplates] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    targetItemId?: string;
    targetItemType?: 'folder' | 'template';
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.isOpen]);


  const handleContextAction = (action: string, data?: { name?: string; itemId?: string; itemType?: string }) => {
    const targetItemId = contextMenu.targetItemId || 'ses-templates';
    
    switch (action) {
      case 'create-folder':
        createFolder(targetItemId, data?.name || 'verification');
        break;
      case 'create-template':
        createTemplate(targetItemId, data?.name || 'Novo Template');
        break;
      case 'rename':
        if (data?.name && contextMenu.targetItemId && contextMenu.targetItemType) {
          renameItem(contextMenu.targetItemId, data.name, contextMenu.targetItemType);
        }
        break;
      case 'delete':
        if (contextMenu.targetItemId) {
          deleteItem(contextMenu.targetItemId);
        }
        break;
    }
    
    // Sempre fechar o menu após qualquer ação
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
  };

  const handleItemContextMenu = (e: React.MouseEvent, itemId: string, itemType: 'folder' | 'template') => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      targetItemId: itemId,
      targetItemType: itemType
    });
  };

  const handleLocalContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      targetItemId: 'ses-templates',
      targetItemType: 'folder'
    });
  };

  const handleItemClick = (item: { id: string; name: string; path: string; type: 'folder' | 'template' }) => {
    if (item.type === 'template') {
      if (item.path) {
        window.location.href = `/verification-templates/${item.path}`;
      } else {
        // Para templates locais, usar o nome como path
        const templateName = item.name.replace('.verification.json', '');
        window.location.href = `/verification-templates/${templateName}`;
      }
    }
  };

  const handleAWSExplorerClick = () => {
    setShowAWSTemplates(!showAWSTemplates);
    setShowLocalTemplates(false);
  };

  const handleLocalExplorerClick = () => {
    setShowLocalTemplates(!showLocalTemplates);
    setShowAWSTemplates(false);
  };


  return (
    <div className="space-y-3">
      {/* Header com título e botões de ação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto hover:bg-muted/50"
          >
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`} 
            />
          </Button>
          <h3 className="text-sm font-medium text-foreground">
            {t('verification.title')}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
      </div>

      {/* Conteúdo do accordion */}
      {isExpanded && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3">
            {/* Botões centralizados */}
            <div className="flex items-center justify-center gap-4 mb-1 pb-3 border-b border-muted">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLocalExplorerClick}
                className="p-2 h-auto hover:bg-muted/50"
                title="List Local Templates"
              >
                <Folder className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAWSExplorerClick}
                className="p-2 h-auto hover:bg-muted/50"
                title="List AWS Templates"
              >
                <CloudDownload className="w-4 h-4" />
              </Button>
            </div>

            {/* Conteúdo baseado no modo selecionado */}
            {showAWSTemplates ? (
              <div className="space-y-2">
                {/* Header Amazon Templates */}
                <div className="flex items-center justify-between p-1">
                  <h4 className="text-sm font-medium">Amazon Templates</h4>
                </div>
                
                {/* Lista de templates da AWS */}
                <AWSTemplatesList 
                  isVisible={showAWSTemplates}
                />
              </div>
            ) : showLocalTemplates ? (
              <div className="space-y-2" onContextMenu={handleLocalContextMenu}>
                {/* Header Local Templates */}
                <div 
                  className="flex items-center justify-between p-1 rounded"
                >
                  <h4 className="text-sm font-medium">Templates Locais</h4>
                </div>
                
                {/* Lista de templates locais */}
                <LocalTemplatesList 
                  isVisible={showLocalTemplates}
                />
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {error && (
                  <p className="text-xs text-destructive p-2 bg-destructive/10 rounded">
                    {t('common.error')}
                  </p>
                )}

                <div 
                  className="space-y-1 min-h-32"
                  onContextMenu={handleLocalContextMenu}
                >
                  {items.map((item) => (
                    <FileTreeItem
                      key={item.id}
                      item={item}
                      onFolderToggle={toggleFolder}
                      onItemContextMenu={handleItemContextMenu}
                      onItemClick={handleItemClick}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Context Menu */}
      <EnhancedContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 } })}
        onAction={handleContextAction}
        itemType={contextMenu.targetItemType}
        isRoot={contextMenu.targetItemId === 'ses-templates'}
      />
    </div>
  );
}

export function Sidebar() {
  const { locale, setLocale } = useLanguage();

  return (
    <aside className="w-80 h-full border-r bg-muted/40 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">SES Pilot</h2>
      </div>
      
      <div className="flex-1 overflow-auto flex flex-col gap-4">
        <VerificationTemplatesSection />
      </div>
      
      <div className="pt-4 border-t">
        <SettingsDropdown currentLocale={locale} onLocaleChange={setLocale} />
      </div>
    </aside>
  );
}
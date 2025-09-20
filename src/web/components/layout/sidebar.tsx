'use client';

import { SyncedTemplateNode } from '@/app/api/verification-templates/sync-status/route';
import { useVerificationTemplates } from '@/hooks/use-verification-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsDropdown } from '@/components/ui/settings-dropdown';
import { ContextMenu } from '@/components/ui/context-menu';
import { FolderTree } from '@/components/ui/folder-tree';
import { useFolderManager } from '@/hooks/use-folder-manager';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { Mail, Folder, Loader2, ChevronDown, RefreshCw, CloudDownload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
  const { localTree, isLoading: templatesLoading, error: templatesError, mutate } = useVerificationTemplates();
  const { 
    folders, 
    isLoading: foldersLoading, 
    error: foldersError, 
    refreshFolders,
    createFolder,
    moveTemplate,
    renameFolder,
    deleteFolder,
    createTemplate,
    toggleFolder
  } = useFolderManager();
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    templateId?: string;
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([mutate(), refreshFolders()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Estados combinados
  const isLoading = templatesLoading || foldersLoading;
  const error = templatesError || foldersError;


  const handleContextAction = (action: string, data?: { name?: string; templateId?: string; folderId?: string }) => {
    if (!data) return;
    
    switch (action) {
      case 'create-folder':
        createFolder('root', data.name);
        break;
      case 'move-template':
        if (data.templateId && data.folderId) {
          moveTemplate(data.templateId, 'root', data.folderId);
        }
        break;
    }
  };

  const handleTemplateClick = (template: { id: string; name: string; path?: string; type: string }) => {
    if (template.path) {
      window.location.href = `/verification-templates/${template.path}`;
    }
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
            {localTree?.length || 0}
          </Badge>
        </div>
      </div>

      {/* Conteúdo do accordion */}
      {isExpanded && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3">
            {/* Ícones centralizados estilo VSCode */}
            <div className="flex items-center justify-center gap-4 mb-4 pb-3 border-b border-muted">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto hover:bg-muted/50"
                title="Explorador Local"
              >
                <Folder className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto hover:bg-muted/50"
                title="AWS Explorer"
              >
                <CloudDownload className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 h-auto hover:bg-muted/50"
                title="Verificar Mudanças"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Árvore de Pastas */}
            <div className="space-y-2">
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

              <FolderTree
                folders={folders}
                onFolderToggle={toggleFolder}
                onFolderRename={renameFolder}
                onFolderDelete={deleteFolder}
                onTemplateMove={moveTemplate}
                onTemplateClick={handleTemplateClick}
                onCreateFolder={createFolder}
                onCreateTemplate={(parentId: string) => createTemplate(parentId, 'Novo Template')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 } })}
        onAction={handleContextAction}
        folders={folders.map(f => ({ id: f.id, name: f.name, templates: [] }))}
        templateId={contextMenu.templateId}
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
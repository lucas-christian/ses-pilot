'use client';

import { SyncedTemplateNode } from '@/app/api/sync-status/route';
import { useTemplates } from '@/hooks/use-templates';
import { useVerificationTemplates } from '@/hooks/use-verification-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { Mail, Folder, Loader2, ChevronRight, PlusCircle, CloudDownload, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

function SyncStatusIndicator({ status }: { status: SyncedTemplateNode['syncStatus'] }) {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  
  if (!status) return null;
  const statusMap = {
    synced: { variant: 'default' as const, title: t('templates.syncStatus.synced') },
    modified: { variant: 'secondary' as const, title: t('templates.syncStatus.modified') },
    new_local: { variant: 'outline' as const, title: t('templates.syncStatus.new_local') },
    unknown: { variant: 'outline' as const, title: t('templates.syncStatus.unknown') },
  };
  const { variant, title } = statusMap[status];
  return <Badge variant={variant} className="text-xs">{title}</Badge>;
}

function TemplateNodeView({ node, basePath, level = 0 }: { node: SyncedTemplateNode; basePath: string; level?: number }) {
  const pathname = usePathname();
  const href = `${basePath}/${node.relativePath}`;
  const isActive = pathname === href;
  const isFolder = node.type === 'folder';
  const Icon = isFolder ? Folder : Mail;

  return (
    <div>
      <Link href={href}>
        <div className={`flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive ? 'bg-accent' : ''}`} style={{ paddingLeft: `${1 + level * 1.5}rem` }}>
          <div className="flex items-center truncate gap-2">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>
          {!isFolder && <SyncStatusIndicator status={node.syncStatus} />}
        </div>
      </Link>
      {isFolder && node.children && (
        <div>{node.children.map((child) => <TemplateNodeView key={child.relativePath} node={child} basePath={basePath} level={level + 1} />)}</div>
      )}
    </div>
  );
}

function ImportAllButton({ remoteTemplates, onImported }: { remoteTemplates: { TemplateName: string; }[], onImported: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);

  const handleImportAll = async () => {
    setIsImporting(true);
    const toastId = toast.loading(t('templates.importing', { count: remoteTemplates.length.toString() }));

    try {
      const templateNames = remoteTemplates.map(t => t.TemplateName);
      const res = await fetch('/api/templates/pull-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateNames }),
      });
      if (!res.ok) throw new Error('Falha na requisição para a API.');
      toast.success(t('templates.importSuccess'), { id: toastId });
      onImported();
    } catch (e) {
      toast.error(t('templates.importError'), { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">{t('templates.emptyRemote')}</p>
        <Button
          onClick={handleImportAll}
          disabled={isImporting}
          className="w-full"
        >
          {isImporting
            ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
            : <CloudDownload className="w-4 h-4 mr-2" />
          }
          {t('templates.importAll', { count: remoteTemplates.length.toString() })}
        </Button>
      </CardContent>
    </Card>
  );
}

function TemplateSection({ title, basePath, hookResult }: { title: string; basePath: string; hookResult: ReturnType<typeof useTemplates | typeof useVerificationTemplates> }) {
  const { localTree, remoteOnly, isLoading, error, mutate } = hookResult;
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-1">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto my-4" />}
          {error && <p className="text-xs text-destructive p-2">{t('common.error')}</p>}

          {/* Lógica do Botão Inteligente */}
          {!isLoading && localTree?.length === 0 && remoteOnly && remoteOnly.length > 0 && (
            <ImportAllButton remoteTemplates={remoteOnly} onImported={mutate} />
          )}

          {localTree && localTree.length > 0 && localTree.map((node) => (
            <TemplateNodeView key={node.relativePath} node={node} basePath={basePath} />
          ))}
          {localTree && localTree.length === 0 && (!remoteOnly || remoteOnly.length === 0) && (
            <p className="text-xs text-muted-foreground p-2">{t('templates.empty')}</p>
          )}
          <Button variant="ghost" size="sm" className="flex items-center gap-2 mt-2">
            <PlusCircle className="w-4 h-4" /> {t('templates.newTemplate')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function Sidebar() {
  const emailTemplates = useTemplates();
  const verificationTemplates = useVerificationTemplates();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation(locale);

  return (
    <aside className="w-80 h-full border-r bg-muted/40 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">SES Pilot</h2>
        <div className="flex items-center gap-2">
          <LanguageToggle currentLocale={locale} onLocaleChange={setLocale} />
          <ThemeToggle />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex flex-col gap-4">
        <TemplateSection
          title={t('templates.title')}
          basePath="/templates"
          hookResult={emailTemplates}
        />
        <TemplateSection
          title={t('verification.title')}
          basePath="/verification-templates"
          hookResult={verificationTemplates}
        />
      </div>
      
      <div className="pt-4 border-t">
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          {t('common.settings')}
        </Button>
      </div>
    </aside>
  );
}
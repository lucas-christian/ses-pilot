'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { 
  FileText, 
  MoreHorizontal,
  Trash2
} from 'lucide-react';

interface TemplateItemProps {
  template: {
    id: string;
    name: string;
    path: string;
    syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
  };
  onTemplateClick?: (template: { id: string; name: string; path: string }) => void;
  onTemplateDelete?: (templateId: string) => void;
}

function SyncStatusIndicator({ status }: { status?: 'synced' | 'modified' | 'new_local' | 'unknown' }) {
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

export function TemplateItem({ 
  template,
  onTemplateClick,
  onTemplateDelete
}: TemplateItemProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };

    if (actionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [actionsOpen]);

  const handleTemplateClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onTemplateClick?.({ id: template.id, name: template.name, path: template.path });
  };

  const handleDelete = () => {
    setActionsOpen(false);
    onTemplateDelete?.(template.id);
  };

  return (
    <div className="relative flex items-center gap-2 py-1 px-2 rounded transition-all duration-200 cursor-pointer min-w-0 hover:bg-accent/50">
      <div className="w-4 h-4 flex items-center justify-center">
        <FileText className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <span className="text-sm truncate block" onClick={handleTemplateClick}>
          {template.name}
        </span>
      </div>

      <div className="flex items-center gap-1 mr-1">
        <SyncStatusIndicator status={template.syncStatus} />
      </div>

      <div className="relative flex-shrink-0" ref={actionsRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setActionsOpen((s) => !s); }}
          className="p-1 rounded hover:bg-muted/50 flex-shrink-0"
          title="Ações"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {actionsOpen && (
          <div
            className="absolute right-0 mt-1 bg-background border rounded shadow p-1 z-50"
            onClick={(e) => e.stopPropagation()}
            style={{ minWidth: 160 }}
          >
            <button className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-destructive/10 rounded text-destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" /> Deletar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

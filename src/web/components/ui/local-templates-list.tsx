'use client';

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { useLocalTemplates, LocalTemplate } from '@/hooks/use-local-templates';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

interface LocalTemplatesListProps {
  isVisible: boolean;
}

export function LocalTemplatesList({ isVisible }: LocalTemplatesListProps) {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const { templates, isLoading, error } = useLocalTemplates();

  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            {t('common.loading')}
          </span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-xs text-destructive">
            {error}
          </p>
        </div>
      )}

      {!isLoading && !error && templates.length === 0 && (
        <div className="text-center py-4">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum template local encontrado
          </p>
        </div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <div className="space-y-2">
          {templates.map((template: LocalTemplate) => (
            <div
              key={template.path}
              className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {template.path}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {template.type === 'verification' ? 'Verificação' : 'E-mail'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

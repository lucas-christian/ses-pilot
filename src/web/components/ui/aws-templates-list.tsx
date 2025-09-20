'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { useAWSTemplates, AWSTemplate } from '@/hooks/use-aws-templates';
import { CloudDownload, Mail, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AWSTemplatesListProps {
  isVisible: boolean;
}

export function AWSTemplatesList({ isVisible }: AWSTemplatesListProps) {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const { templates, isLoading, error, pullTemplatesFromAWS, fetchAWSTemplates } = useAWSTemplates();
  const [isPulling, setIsPulling] = useState(false);

  const handlePullTemplates = async () => {
    setIsPulling(true);
    try {
      const result = await pullTemplatesFromAWS();
      toast.success(result.message);
    } catch {
      toast.error('Erro ao puxar templates da AWS');
    } finally {
      setIsPulling(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      {/* Botões de ação */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePullTemplates}
          disabled={isPulling || isLoading}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          {isPulling ? 'Puxando...' : 'Pull from AWS'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAWSTemplates}
          disabled={isLoading}
          className="p-2"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

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
          <CloudDownload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('aws.noTemplates')}
          </p>
        </div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <div className="space-y-2">
          {templates.map((template: AWSTemplate) => (
            <div
              key={template.TemplateName}
              className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Mail className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {template.TemplateName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {template.FromEmailAddress}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                AWS
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

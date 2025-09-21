'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { useTemplateCounts } from '@/hooks/use-template-counts';
import { useConfig } from '@/hooks/use-config';
import { Cloud, FileText, Folder, Settings, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineEditor } from '@/components/ui/inline-editor';
import { useState } from 'react';

export default function DashboardPage() {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const { 
    verificationTemplates: verificationTemplateCount, 
    isLoading 
  } = useTemplateCounts();
  
  const { config, updateConfig } = useConfig();
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('common.welcome')} ✈️</h1>
        <p className="text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </div>

            {/* Informações de Configuração */}
            {config && (
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configuração Atual
                      <Badge variant={config.mode === 'local' ? 'default' : 'outline'}>
                        {config.mode === 'local' ? 'Local' : 'Global'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Informações sobre a pasta e modo de trabalho
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Pasta de Templates - Ocupa toda a largura */}
                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <Folder className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Pasta de Templates</p>
                            {isRenamingFolder ? (
                              <InlineEditor
                                initialValue={config.templatesPath.split('/').pop() || 'ses-templates'}
                                placeholder="Nome da pasta"
                                onCancel={() => setIsRenamingFolder(false)}
                                onSubmit={async (newName) => {
                                  const trimmed = newName.trim();
                                  if (!trimmed) {
                                    setIsRenamingFolder(false);
                                    return;
                                  }
                                  
                                  try {
                                    const currentName = config.templatesPath.split('/').pop() || 'ses-templates';
                                    const newPath = config.templatesPath.replace(currentName, trimmed);
                                    await updateConfig({ templatesPath: newPath });
                                    setIsRenamingFolder(false);
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Erro ao renomear pasta:', error);
                                    alert('Erro ao renomear pasta. Tente novamente.');
                                    setIsRenamingFolder(false);
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground font-mono">
                                {config.templatesPath}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRenamingFolder(true)}
                          disabled={isRenamingFolder}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Renomear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('dashboard.verificationTemplates')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.verificationTemplatesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {isLoading ? '...' : verificationTemplateCount}
              </span>
              <Badge variant="outline">{t('dashboard.local')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              {t('dashboard.awsStatus')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.awsStatusDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="default">{t('dashboard.connected')}</Badge>
              <Badge variant="outline">{t('dashboard.online')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
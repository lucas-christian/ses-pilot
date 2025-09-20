'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { CodeEditor } from '@/features/template-editor/code-editor';
import { PreviewPanel } from '@/features/template-editor/preview-panel';
import { FileText, Save, CloudUpload, Download, Eye, Trash2, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { TestEmailModal } from '@/components/ui/test-email-modal';

interface VerificationTemplate {
  htmlContent: string;
  templateJson: {
    Template: {
      TemplateName: string;
      SubjectPart: string;
    }
  }
}

export default function VerificationTemplatePage() {
  const params = useParams();
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const [template, setTemplate] = useState<VerificationTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(false);

  const templatePath = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : null;

  const loadTemplate = useCallback(async () => {
    if (!templatePath) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/verification-templates/${templatePath}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [templatePath]);

  useEffect(() => {
    if (templatePath) {
      loadTemplate();
    } else {
      // Novo template
      setIsNewTemplate(true);
      setTemplate({
        htmlContent: '',
        templateJson: {
          Template: {
            TemplateName: '',
            SubjectPart: '',
          }
        }
      });
    }
  }, [templatePath, loadTemplate]);

  const saveTemplate = async () => {
    if (!template) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/verification-templates/${templatePath || 'new'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      
      if (response.ok) {
        toast.success(t('editor.saveSuccess'));
        if (isNewTemplate) {
          // Redirecionar para o template salvo
          const savedTemplate = await response.json();
          window.history.pushState(null, '', `/verification-templates/${savedTemplate.path}`);
          setIsNewTemplate(false);
        }
      } else {
        toast.error(t('editor.saveError'));
      }
    } catch {
      toast.error(t('editor.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const deployTemplate = async () => {
    if (!template) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/verification-templates/${templatePath}?action=deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      
      if (response.ok) {
        toast.success(t('editor.deploySuccess'));
      } else {
        toast.error(t('editor.deployError'));
      }
    } catch {
      toast.error(t('editor.deployError'));
    } finally {
      setIsLoading(false);
    }
  };

  const pullFromAWS = async () => {
    if (!templatePath) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/verification-templates/${templatePath}?action=pull`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
        toast.success(t('verification.pullSuccess'));
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async () => {
    if (!templatePath) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/verification-templates/${templatePath}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(t('common.success'));
        // Redirecionar para dashboard
        window.location.href = '/';
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !template) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('verification.title')}</h2>
            <p className="text-muted-foreground mb-4">{t('verification.empty')}</p>
            <Button onClick={() => setIsNewTemplate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('verification.newTemplate')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {isNewTemplate ? t('verification.newTemplate') : template.templateJson.Template.TemplateName}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t('dashboard.local')}</Badge>
            {!isNewTemplate && (
              <Badge variant="secondary">{t('verification.syncStatus.modified')}</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {t('editor.preview')}
          </Button>
          
          {!isNewTemplate && templatePath && (
            <TestEmailModal templatePath={templatePath} isVerification={true}>
              <Button variant="outline" disabled={isLoading}>
                <Send className="w-4 h-4 mr-2" />
                {t('testEmail.title')}
              </Button>
            </TestEmailModal>
          )}
          
          {!isNewTemplate && (
            <Button
              variant="outline"
              onClick={pullFromAWS}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('verification.pull')}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={deployTemplate}
            disabled={isLoading}
          >
            <CloudUpload className="w-4 h-4 mr-2" />
            {t('editor.deploy')}
          </Button>
          
          <Button
            onClick={saveTemplate}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {t('editor.save')}
          </Button>
          
          {!isNewTemplate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('common.delete')}</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja excluir este template de verificação? Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">{t('common.cancel')}</Button>
                  <Button variant="destructive" onClick={deleteTemplate}>
                    {t('common.delete')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Template Name */}
          <Card>
            <CardHeader>
              <CardTitle>{t('verification.templateName')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={template.templateJson.Template.TemplateName}
                onChange={(e) => setTemplate({ ...template, templateJson: { ...template.templateJson, Template: { ...template.templateJson.Template, TemplateName: e.target.value } } })}
                placeholder="Nome do template de verificação"
                disabled
              />
            </CardContent>
          </Card>

          {/* Subject */}
          <Card>
            <CardHeader>
              <CardTitle>{t('verification.subject')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={template.templateJson.Template.SubjectPart}
                onChange={(e) => setTemplate({ ...template, templateJson: { ...template.templateJson, Template: { ...template.templateJson.Template, SubjectPart: e.target.value } } })}
                placeholder="Assunto do e-mail de verificação"
              />
            </CardContent>
          </Card>

          {/* HTML Content */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{t('verification.htmlContent')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-md">
                <CodeEditor
                  value={template.htmlContent}
                  onChange={(value) => setTemplate({ ...template, htmlContent: value || '' })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>{t('editor.preview')}</CardTitle>
              <CardDescription>
                Visualização do e-mail de verificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <PreviewPanel htmlContent={template.htmlContent} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

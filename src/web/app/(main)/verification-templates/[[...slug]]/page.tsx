'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { CodeEditor } from '@/features/template-editor/code-editor';
import { PreviewPanel } from '@/features/template-editor/preview-panel';
import { FileText, Save, CloudUpload, Download, Trash2, Plus, Send, Maximize2, Code, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { TestEmailModal } from '@/components/ui/test-email-modal';

interface VerificationTemplate {
  htmlContent: string;
  templateJson: {
    Template: {
      TemplateName: string;
      SubjectPart: string;
    };
    FromEmailAddress: string;
    SuccessRedirectionURL: string;
    FailureRedirectionURL: string;
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
  const [showMaximizedPreview, setShowMaximizedPreview] = useState(false);
  const [showMaximizedHtmlEditor, setShowMaximizedHtmlEditor] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(true);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);

  const templatePath = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : null;

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templatePath) {
        // Novo template
        setIsNewTemplate(true);
        setTemplate({
          htmlContent: '',
          templateJson: {
            Template: {
              TemplateName: '',
              SubjectPart: '',
            },
            FromEmailAddress: '',
            SuccessRedirectionURL: '',
            FailureRedirectionURL: ''
          }
        });
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/verification-templates/${templatePath}`);
        if (response.ok) {
          const data = await response.json();
          setTemplate(data);
        } else {
          toast.error('Erro ao carregar template');
        }
      } catch {
        toast.error('Erro ao carregar template');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templatePath]);

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
      const response = await fetch('/api/verification-templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: templatePath?.split('/') || [],
          templateData: template
        }),
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

      {/* Template Configuration */}
      <div className="space-y-6 mb-6">
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

        {/* Subject and Email Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <Card>
            <CardHeader>
              <CardTitle>E-mail de Origem</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={template.templateJson.FromEmailAddress}
                onChange={(e) => setTemplate({ ...template, templateJson: { ...template.templateJson, FromEmailAddress: e.target.value } })}
                placeholder="Confirme seu e-mail <confirmation@dev-luch.com>"
              />
            </CardContent>
          </Card>
        </div>

        {/* URLs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>URL de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={template.templateJson.SuccessRedirectionURL}
                onChange={(e) => setTemplate({ ...template, templateJson: { ...template.templateJson, SuccessRedirectionURL: e.target.value } })}
                placeholder="https://dev-luch.com/email_confirmed"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>URL de Falha</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={template.templateJson.FailureRedirectionURL}
                onChange={(e) => setTemplate({ ...template, templateJson: { ...template.templateJson, FailureRedirectionURL: e.target.value } })}
                placeholder="https://dev-luch.com/email_failed"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* HTML Content Button */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('verification.htmlContent')}</CardTitle>
          <CardDescription>
            Edite o conteúdo HTML do template de verificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {template.htmlContent.length > 0 
                  ? `${template.htmlContent.length} caracteres` 
                  : 'Nenhum conteúdo HTML'
                }
              </span>
            </div>
            <Button onClick={() => setShowHtmlEditor(true)}>
              <Code className="w-4 h-4 mr-2" />
              Editar HTML
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('editor.preview')}</CardTitle>
              <CardDescription>
                Visualização do e-mail de verificação
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                Ocultar Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMaximizedPreview(true)}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Maximizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <PreviewPanel htmlContent={template.htmlContent} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Preview Button when hidden */}
      {!showPreview && (
        <Card>
          <CardContent className="p-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Mostrar Preview
            </Button>
          </CardContent>
        </Card>
      )}


      {/* HTML Editor Modal */}
      <Dialog open={showHtmlEditor} onOpenChange={setShowHtmlEditor}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle>Editor HTML - {t('verification.htmlContent')}</DialogTitle>
            <DialogDescription>
              Edite o conteúdo HTML e visualize o resultado em tempo real
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6 pt-2 min-h-0 flex gap-6">
            {/* HTML Editor */}
            <div className={`flex flex-col transition-all duration-300 ${showEditorPanel ? 'flex-1 min-w-0' : 'w-48 flex-shrink-0'}`}>
              {showEditorPanel ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Editor HTML</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {template.htmlContent.length} caracteres
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMaximizedHtmlEditor(true)}
                      >
                        <Maximize2 className="w-4 h-4 mr-1" />
                        Maximizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditorPanel(false)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 border rounded-md overflow-hidden">
                    <CodeEditor
                      value={template.htmlContent}
                      onChange={(value) => setTemplate({ ...template, htmlContent: value || '' })}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Button onClick={() => setShowEditorPanel(true)}>
                    <Code className="w-4 h-4 mr-2" />
                    Mostrar Editor
                  </Button>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className={`flex flex-col transition-all duration-300 ${showPreviewPanel ? 'flex-1 min-w-0' : 'w-48 flex-shrink-0'}`}>
              {showPreviewPanel ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Preview</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMaximizedPreview(true)}
                      >
                        <Maximize2 className="w-4 h-4 mr-1" />
                        Maximizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreviewPanel(false)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 border rounded-md overflow-hidden">
                    <PreviewPanel htmlContent={template.htmlContent} />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Button onClick={() => setShowPreviewPanel(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar Preview
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowHtmlEditor(false)}>
              Fechar
            </Button>
            <Button onClick={() => setShowHtmlEditor(false)}>
              Salvar e Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maximized Preview Modal */}
      <Dialog open={showMaximizedPreview} onOpenChange={setShowMaximizedPreview}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle>{t('editor.preview')} - Visualização Completa</DialogTitle>
            <DialogDescription>
              Visualização em tela cheia do e-mail de verificação
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6 pt-2 min-h-0">
            <div className="h-full">
              <PreviewPanel htmlContent={template.htmlContent} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maximized HTML Editor Modal */}
      <Dialog open={showMaximizedHtmlEditor} onOpenChange={setShowMaximizedHtmlEditor}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-2 flex-shrink-0">
            <DialogTitle>Editor HTML - Edição Completa</DialogTitle>
            <DialogDescription>
              Edição em tela cheia do conteúdo HTML do template
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6 pt-2 min-h-0">
            <div className="h-full">
              <CodeEditor
                value={template.htmlContent}
                onChange={(value) => setTemplate(prev => prev ? { ...prev, htmlContent: value || '' } : null)}
                language="html"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-2 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowMaximizedHtmlEditor(false)}>
              Fechar
            </Button>
            <Button onClick={() => setShowMaximizedHtmlEditor(false)}>
              Salvar e Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

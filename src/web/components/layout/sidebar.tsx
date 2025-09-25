'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsDropdown } from '@/components/ui/settings-dropdown';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { AWSTemplatesList } from '@/components/ui/aws-templates-list';
import { useFileManager } from '@/hooks/use-file-manager';
import { TemplateItem } from '@/components/ui/file-tree-item';
import { InlineEditor } from '@/components/ui/inline-editor';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { Loader2, ChevronDown, CloudDownload, FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';


function VerificationTemplatesSection() {
  const { 
    templates, 
    isLoading, 
    error
  } = useFileManager();
  
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAWSTemplates, setShowAWSTemplates] = useState(false);
  const [showCreateEditor, setShowCreateEditor] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    templateId: string;
    templateName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    templateId: '',
    templateName: '',
    isLoading: false
  });

  const handleTemplateClick = (template: { id: string; name: string; path: string }) => {
    const templateName = template.name.replace('.verification.json', '');
    window.location.href = `/verification-templates/${templateName}`;
  };

  const handleTemplateDelete = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setDeleteModal({
        isOpen: true,
        templateId,
        templateName: template.name,
        isLoading: false
      });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/verification-templates/${deleteModal.templateId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
        window.location.href = '/';
      } else {
        alert('Erro ao deletar template');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      alert('Erro ao deletar template');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      templateId: '',
      templateName: '',
      isLoading: false
    });
  };

  const handleCreateTemplate = () => {
    setShowCreateEditor(true);
  };

  const handleCreateTemplateSubmit = async (templateName: string) => {
    if (!templateName || !templateName.trim()) {
      setShowCreateEditor(false);
      return;
    }

    try {
      const response = await fetch('/api/verification-templates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateName: templateName.trim() }),
      });

      if (response.ok) {
        window.location.href = `/verification-templates/${templateName.trim()}`;
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar template');
      }
    } catch {
      alert('Erro ao criar template');
    } finally {
      setShowCreateEditor(false);
    }
  };

  const handleCreateTemplateCancel = () => {
    setShowCreateEditor(false);
  };

  const handleAWSExplorerClick = () => {
    setShowAWSTemplates(!showAWSTemplates);
  };


  return (
    <div className="space-y-3">
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
            {templates.length}
          </Badge>
        </div>
      </div>

      {isExpanded && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3">
            <div className="relative flex items-center justify-center gap-4 mb-4 pb-3 border-b border-muted">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAWSTemplates(false)}
                className="p-2 h-auto hover:bg-muted/50"
                title="List Local Templates"
              >
                <FileText className="w-4 h-4" />
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
              
              {/* Botão + centralizado na linha */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateTemplate}
                className="absolute p-1 h-auto bg-muted rounded-full border border-muted hover:p-1.5 transition-all duration-200"
                style={{ 
                  bottom: '0', 
                  transform: 'translateY(50%)'
                }}
                title="Criar Novo Template"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showAWSTemplates ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-1">
                  <h4 className="text-sm font-medium">Amazon Templates</h4>
                </div>
                
                <AWSTemplatesList 
                  isVisible={showAWSTemplates}
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
                {showCreateEditor && (
                  <InlineEditor
                    initialValue=""
                    placeholder="Nome do template"
                    onCancel={handleCreateTemplateCancel}
                    onSubmit={handleCreateTemplateSubmit}
                  />
                )}
                <div className="space-y-1 min-h-32">
                  {templates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      onTemplateClick={handleTemplateClick}
                      onTemplateDelete={handleTemplateDelete}
                    />
                  ))}
                </div>
              </>
                )}
              </CardContent>
            </Card>
          )}
          
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Deletar Template"
            description="Esta ação não pode ser desfeita. O template será permanentemente removido."
            itemName={deleteModal.templateName}
            isLoading={deleteModal.isLoading}
          />
        </div>
      );
    }

export function Sidebar() {
  const { locale, setLocale } = useLanguage();

  return (
    <aside className="w-80 h-full border-r bg-muted/40 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/">
          <h2 className="text-lg font-semibold">SES Pilot</h2>
        </Link>
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
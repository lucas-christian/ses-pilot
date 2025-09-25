import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { listRemoteVerificationTemplates } from '@/lib/aws';
import fs from 'fs-extra';
import path from 'path';

export interface TemplateWithSyncStatus {
  id: string;
  name: string;
  path: string;
  syncStatus: 'synced' | 'modified' | 'new_local' | 'unknown';
  lastModified: string;
}

export async function GET() {
  try {
    const templatesPath = await getTemplatesPath();
    
    if (!templatesPath) {
      return NextResponse.json(
        { error: 'O caminho para os templates não está configurado.' },
        { status: 500 }
      );
    }

    // Busca templates locais
    const localTemplates = [];
    const files = await fs.readdir(templatesPath);
    
    for (const file of files) {
      if (file.endsWith('.verification.json')) {
        const filePath = path.join(templatesPath, file);
        const stats = await fs.stat(filePath);
        
        let templateName = file.replace('.verification.json', '');
        try {
          const content = await fs.readJson(filePath);
          templateName = content.Template?.TemplateName || templateName;
        } catch {
          // Ignora erros de parsing
        }
        
        localTemplates.push({
          name: templateName,
          file: file,
          lastModified: stats.mtime.toISOString()
        });
      }
    }

    // Busca templates remotos
    const remoteTemplates = await listRemoteVerificationTemplates();
    const remoteTemplatesMap = new Map(remoteTemplates.map(t => [t.TemplateName, t]));

    // Combina os dados com status de sincronização
    const templatesWithStatus: TemplateWithSyncStatus[] = await Promise.all(
      localTemplates.map(async (template) => {
        const remoteTemplate = remoteTemplatesMap.get(template.name);
        
        let syncStatus: 'synced' | 'modified' | 'new_local' | 'unknown' = 'unknown';
        
        if (remoteTemplate) {
          // Existe na AWS, compara o conteúdo
          try {
            // Lê o template local
            const localFilePath = path.join(templatesPath, template.file);
            const localTemplateData = await fs.readJson(localFilePath);
            
            // Busca o conteúdo remoto
            const { getRemoteTemplateContent } = await import('@/lib/aws');
            const remoteContent = await getRemoteTemplateContent(template.name);
            
            // Compara os conteúdos principais
            const localHtml = localTemplateData.HtmlPart || '';
            const remoteHtml = remoteContent.Html || '';
            
            const localSubject = localTemplateData.Template?.SubjectPart || '';
            const remoteSubject = remoteContent.Subject || '';
            
            // Se há diferenças no HTML ou Subject, está modificado
            if (localHtml !== remoteHtml || localSubject !== remoteSubject) {
              syncStatus = 'modified';
            } else {
              syncStatus = 'synced';
            }
          } catch (error) {
            console.error(`Erro ao comparar template ${template.name}:`, error);
            // Em caso de erro, assume como modificado para segurança
            syncStatus = 'modified';
          }
        } else {
          // Não existe na AWS, é novo local
          syncStatus = 'new_local';
        }
        
        return {
          id: template.file,
          name: template.file,
          path: template.file,
          syncStatus,
          lastModified: template.lastModified
        };
      })
    );

    return NextResponse.json({
      templates: templatesWithStatus,
      count: templatesWithStatus.length
    });
    
  } catch (error: unknown) {
    console.error('Erro ao buscar templates com status de sincronização:', error);
    return NextResponse.json(
      { 
        error: 'Falha ao buscar templates com status de sincronização.', 
        details: (error as { message: string; }).message 
      }, 
      { status: 500 }
    );
  }
}

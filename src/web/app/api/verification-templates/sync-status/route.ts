import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getVerificationTemplates } from '@/lib/file-system';
import { listRemoteVerificationTemplates } from '@/lib/aws';

export interface SyncedTemplateNode {
  name: string;
  type: 'folder' | 'template';
  relativePath: string;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
  children?: SyncedTemplateNode[];
}

export async function GET() {
  try {
    const templatesPath = await getTemplatesPath();
    const localTree = await getVerificationTemplates(templatesPath);
    const remoteTemplates = await listRemoteVerificationTemplates();
    const remoteTemplatesMap = new Map(remoteTemplates.map(t => [t.TemplateName, t]));

    const syncTree = async (nodes: SyncedTemplateNode[]): Promise<SyncedTemplateNode[]> => {
      for (const node of nodes) {
        if (node.type === 'template') {
          // Para verificação, o nome da pasta É o nome do template na AWS
          const templateName = node.name;
          const remoteTemplate = remoteTemplatesMap.get(templateName);
          
          // Como não temos timestamp, um template "existe" ou "não existe".
          // Se existe em ambos, consideramos sincronizado por padrão.
          node.syncStatus = remoteTemplate ? 'synced' : 'new_local';
          
          if(remoteTemplate) {
            remoteTemplatesMap.delete(templateName); // Remove para sobrar apenas os remotos
          }
        }
        if (node.children) {
          await syncTree(node.children);
        }
      }
      return nodes;
    };

    const syncedTree = await syncTree(localTree);
    const remoteOnlyTemplates = Array.from(remoteTemplatesMap.values());

    return NextResponse.json({
      localTree: syncedTree,
      remoteOnly: remoteOnlyTemplates,
    });

  } catch (error: unknown) {
    return NextResponse.json({ error: 'Falha ao obter status de templates de verificação.', details: (error as { message: string; }).message }, { status: 500 });
  }
}
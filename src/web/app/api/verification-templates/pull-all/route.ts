import { NextResponse } from 'next/server';
import { getTemplatesPath } from '@/lib/config';
import { getVerificationTemplates, TemplateNode } from '@/lib/file-system';
import { listRemoteVerificationTemplates } from '@/lib/aws';
import fs from 'fs-extra';
import path from 'path';

export type SyncStatus = 'synced' | 'modified' | 'new_local' | 'unknown';

export interface SyncedTemplateNode extends TemplateNode {
  syncStatus?: SyncStatus;
}


async function getTemplateNameFromVerificationFile(filePath: string): Promise<string | null> {
    try {
        const json = await fs.readJson(filePath);
        return json.Template?.TemplateName || null;
    } catch {
        return null;
    }
}

export async function GET() {
  try {
    const templatesPath = await getTemplatesPath();
    const verificationTree = await getVerificationTemplates(templatesPath);
    const remoteTemplates = await listRemoteVerificationTemplates();
    const remoteTemplatesMap = new Map(remoteTemplates.map(t => [t.TemplateName, t]));


    const syncVerificationTree = async (nodes: TemplateNode[]): Promise<SyncedTemplateNode[]> => {
      const result: SyncedTemplateNode[] = [];
      for (const node of nodes) {
        if (node.type === 'template') {
          const jsonPath = path.join(templatesPath, '_verification', node.relativePath, 'verification-template.json');
          const templateName = await getTemplateNameFromVerificationFile(jsonPath);
          let syncStatus: SyncStatus = 'unknown';

          if (templateName) {
            const remoteTemplate = remoteTemplatesMap.get(templateName);
            if (remoteTemplate) {
              // Para verification templates, não temos timestamp, então consideramos sincronizado
              syncStatus = 'synced';
            } else {
              syncStatus = 'new_local';
            }
          }
          result.push({ ...node, syncStatus });
        } else if (node.children) {
          result.push({ ...node, children: await syncVerificationTree(node.children) });
        }
      }
      return result;
    };

    const syncedVerificationTree = await syncVerificationTree(verificationTree);

    // Encontra templates que só existem remotamente
    const remoteTemplatesInUseMap = new Map(remoteTemplates.map(t => [t.TemplateName, t]));
    
    const checkVerificationTree = async (nodes: SyncedTemplateNode[]) => {
        for (const node of nodes) {
            if (node.type === 'template') {
                const jsonPath = path.join(templatesPath, '_verification', node.relativePath, 'verification-template.json');
                const templateName = await getTemplateNameFromVerificationFile(jsonPath);
                if (templateName) {
                    remoteTemplatesInUseMap.delete(templateName);
                }
            }
            if (node.children) {
                await checkVerificationTree(node.children);
            }
        }
    };
    
    await checkVerificationTree(syncedVerificationTree);

    const remoteOnlyTemplates = Array.from(remoteTemplatesInUseMap.values());

    return NextResponse.json({
      verificationTree: syncedVerificationTree,
      remoteOnly: remoteOnlyTemplates,
    });

  } catch (error: unknown) {
    return NextResponse.json({ error: 'Falha ao obter status de sincronização.', details: (error as { message: string; }).message }, { status: 500 });
  }
}
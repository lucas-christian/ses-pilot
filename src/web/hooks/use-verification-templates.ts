'use client';

import useSWR from 'swr';
import type { SyncedTemplateNode } from '@/app/api/verification-templates/sync-status/route';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// A API agora retorna um objeto com verificationTree, então atualizamos o tipo
interface SyncStatusResponse {
  localTree: SyncedTemplateNode[];
  verificationTree: SyncedTemplateNode[];
  remoteOnly: { TemplateName: string }[];
}

export function useVerificationTemplates() {
  const { data, error, isLoading, mutate } = useSWR<SyncStatusResponse>('/api/verification-templates/sync-status', fetcher);

  return {
    // Retornamos os dados de forma separada para facilitar o uso
    localTree: data?.localTree,
    remoteOnly: data?.remoteOnly,
    error,
    isLoading,
    mutate,
  };
}
'use client';

import useSWR from 'swr';
import type { SyncedTemplateNode } from '@/app/api/sync-status/route';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// A API agora retorna um objeto com verificationTree, então atualizamos o tipo
interface SyncStatusResponse {
  localTree: SyncedTemplateNode[];
  verificationTree: SyncedTemplateNode[];
  remoteOnly: { TemplateName: string }[];
}

export function useVerificationTemplates() {
  const { data, error, isLoading, mutate } = useSWR<SyncStatusResponse>('/api/sync-status', fetcher);

  return {
    // Retornamos os dados de forma separada para facilitar o uso
    localTree: data?.verificationTree,
    remoteOnly: data?.remoteOnly,
    error,
    isLoading,
    mutate,
  };
}
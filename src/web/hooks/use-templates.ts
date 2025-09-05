'use client';

import useSWR from 'swr';
import type { SyncedTemplateNode } from '@/app/api/sync-status/route';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// A API agora retorna um objeto, então atualizamos o tipo
interface SyncStatusResponse {
  localTree: SyncedTemplateNode[];
  remoteOnly: { TemplateName: string }[];
}

export function useTemplates() {
  const { data, error, isLoading, mutate } = useSWR<SyncStatusResponse>('/api/sync-status', fetcher);

  return {
    // Retornamos os dados de forma separada para facilitar o uso
    localTree: data?.localTree,
    remoteOnly: data?.remoteOnly,
    error,
    isLoading,
    mutate,
  };
}
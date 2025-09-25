'use client';

import useSWR from 'swr';

export interface TemplateItem {
  id: string;
  name: string;
  path: string;
  syncStatus?: 'synced' | 'modified' | 'new_local' | 'unknown';
}

export interface TemplateState {
  templates: TemplateItem[];
  isLoading: boolean;
  error: string | null;
}

export function useFileManager() {
  const { data: templates, error, isLoading, mutate: refreshTemplates } = useSWR(
    '/api/verification-templates/with-sync-status',
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao carregar templates');
      }
      const data = await response.json();
      return data.templates;
    }
  );

  return {
    templates: templates || [],
    isLoading,
    error: error?.message || null,
    refresh: refreshTemplates
  };
}

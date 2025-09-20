'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TemplateCountsResponse {
  emailTemplates: number;
  verificationTemplates: number;
  total: number;
}

export function useTemplateCounts() {
  const { data, error, isLoading, mutate } = useSWR<TemplateCountsResponse>('/api/template-counts', fetcher);

  return {
    emailTemplates: data?.emailTemplates ?? 0,
    verificationTemplates: data?.verificationTemplates ?? 0,
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  };
}

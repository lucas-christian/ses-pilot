'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [state, setState] = useState<TemplateState>({
    templates: [],
    isLoading: true,
    error: null
  });

  const { data: syncData } = useSWR('/api/verification-templates/sync-status');

  const loadTemplates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/verification-templates/local-list');
      if (!response.ok) {
        throw new Error('Erro ao carregar templates');
      }
      const data = await response.json();
      
      const templates: TemplateItem[] = data.templates.map((template: { name: string }) => {
        let syncStatus: 'synced' | 'modified' | 'new_local' | 'unknown' = 'unknown';
        
        if (syncData && template.name) {
          const templateName = template.name.replace('.verification.json', '');
          
          const existsInRemote = syncData.remoteOnly?.some((remote: { TemplateName: string }) => 
            remote.TemplateName === templateName
          );
          
          const existsInLocal = syncData.localTree?.some((local: { name: string }) => 
            local.name === templateName
          );
          
          if (existsInRemote && existsInLocal) {
            syncStatus = 'synced';
          } else if (existsInLocal && !existsInRemote) {
            syncStatus = 'new_local';
          } else {
            syncStatus = 'unknown';
          }
        } else {
          syncStatus = 'new_local';
        }

        return {
          id: template.name,
          name: template.name,
          path: template.name,
          syncStatus
        };
      });
      
      setState({
        templates,
        isLoading: false,
        error: null
      });
    } catch (err) {
      setState({
        templates: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar templates'
      });
    }
  }, [syncData]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    ...state,
    refresh: loadTemplates
  };
}

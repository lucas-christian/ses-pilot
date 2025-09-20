'use client';

import { useState, useEffect } from 'react';

export interface LocalTemplate {
  name: string;
  path: string;
  type: 'verification' | 'email';
  lastModified?: string;
}

export function useLocalTemplates() {
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocalTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verification-templates/local-list');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar templates locais');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar templates locais');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar templates automaticamente quando o hook é usado
  useEffect(() => {
    fetchLocalTemplates();
  }, []);

  return {
    templates,
    isLoading,
    error,
    fetchLocalTemplates,
  };
}

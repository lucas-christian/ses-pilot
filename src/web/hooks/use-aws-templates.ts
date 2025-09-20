'use client';

import { useState, useEffect } from 'react';

export interface AWSTemplate {
  TemplateName: string;
  FromEmailAddress: string;
  Subject: string;
  SuccessRedirectionURL: string;
  FailureRedirectionURL: string;
  TemplateContent: {
    Html: string;
    Text?: string;
  };
}

export function useAWSTemplates() {
  const [templates, setTemplates] = useState<AWSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar templates automaticamente quando o hook é usado
  useEffect(() => {
    fetchAWSTemplates();
  }, []);

  const fetchAWSTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verification-templates/aws-list');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar templates da AWS');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar templates da AWS');
    } finally {
      setIsLoading(false);
    }
  };

  const pullTemplatesFromAWS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verification-templates/pull-from-aws', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao puxar templates da AWS');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao puxar templates da AWS');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    templates,
    isLoading,
    error,
    fetchAWSTemplates,
    pullTemplatesFromAWS,
  };
}

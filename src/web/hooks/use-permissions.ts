import { useState, useEffect } from 'react';

export interface SESPermissions {
  canListTemplates: boolean;
  canCreateTemplates: boolean;
  canUpdateTemplates: boolean;
  canDeleteTemplates: boolean;
  canSendEmails: boolean;
  canListVerificationTemplates: boolean;
  canCreateVerificationTemplates: boolean;
  canUpdateVerificationTemplates: boolean;
  canDeleteVerificationTemplates: boolean;
  canSendVerificationEmails: boolean;
  canListIdentities: boolean;
  canVerifyIdentities: boolean;
  canGetSendQuota: boolean;
  canGetSendRate: boolean;
}

export interface PermissionData {
  callerIdentity: {
    UserId: string;
    Account: string;
    Arn: string;
  };
  permissions: SESPermissions;
  details: Array<{
    permission: string;
    allowed: boolean;
    reason?: string;
  }>;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Tenta primeiro a API simplificada
      let response = await fetch('/api/permissions/simple');
      let data = await response.json();
      
      if (!response.ok) {
        // Se falhar, tenta a API completa
        response = await fetch('/api/permissions');
        data = await response.json();
      }
      
      if (response.ok) {
        setPermissions(data);
      } else {
        setError(data.error || 'Erro ao carregar permissões');
      }
    } catch (err) {
      setError('Falha na conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    permissions,
    isLoading,
    error,
    refetch: fetchPermissions
  };
}

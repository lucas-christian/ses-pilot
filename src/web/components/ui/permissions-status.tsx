'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions, SESPermissions } from '@/hooks/use-permissions';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { Shield, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

interface PermissionItemProps {
  permission: string;
  allowed: boolean;
  description: string;
  allowedText: string;
  deniedText: string;
}

function PermissionItem({ permission, allowed, description, allowedText, deniedText }: PermissionItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {allowed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <p className="font-medium">{permission}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant={allowed ? 'default' : 'destructive'}>
        {allowed ? allowedText : deniedText}
      </Badge>
    </div>
  );
}

export function PermissionsStatus() {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const { permissions, isLoading, error, refetch } = usePermissions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('permissions.checking')}
          </CardTitle>
          <CardDescription>
            {t('permissions.checkingDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            {t('permissions.error')}
          </CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('permissions.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!permissions) {
    return null;
  }

  // Verifica se tem permissões completas ou simplificadas
  const hasFullPermissions = permissions && 'canUpdateTemplates' in permissions.permissions;
  
  const permissionGroups = hasFullPermissions ? [
    {
      title: t('permissions.emailTemplates'),
      permissions: [
        {
          key: 'canListTemplates' as keyof SESPermissions,
          name: t('permissions.listTemplates'),
          description: t('permissions.listTemplatesDesc')
        },
        {
          key: 'canCreateTemplates' as keyof SESPermissions,
          name: t('permissions.createTemplates'),
          description: t('permissions.createTemplatesDesc')
        },
        {
          key: 'canUpdateTemplates' as keyof SESPermissions,
          name: t('permissions.updateTemplates'),
          description: t('permissions.updateTemplatesDesc')
        },
        {
          key: 'canDeleteTemplates' as keyof SESPermissions,
          name: t('permissions.deleteTemplates'),
          description: t('permissions.deleteTemplatesDesc')
        },
        {
          key: 'canSendEmails' as keyof SESPermissions,
          name: t('permissions.sendEmails'),
          description: t('permissions.sendEmailsDesc')
        }
      ]
    },
    {
      title: t('permissions.verificationTemplates'),
      permissions: [
        {
          key: 'canListVerificationTemplates' as keyof SESPermissions,
          name: t('permissions.listVerificationTemplates'),
          description: t('permissions.listVerificationTemplatesDesc')
        },
        {
          key: 'canCreateVerificationTemplates' as keyof SESPermissions,
          name: t('permissions.createVerificationTemplates'),
          description: t('permissions.createVerificationTemplatesDesc')
        },
        {
          key: 'canUpdateVerificationTemplates' as keyof SESPermissions,
          name: t('permissions.updateVerificationTemplates'),
          description: t('permissions.updateVerificationTemplatesDesc')
        },
        {
          key: 'canDeleteVerificationTemplates' as keyof SESPermissions,
          name: t('permissions.deleteVerificationTemplates'),
          description: t('permissions.deleteVerificationTemplatesDesc')
        },
        {
          key: 'canSendVerificationEmails' as keyof SESPermissions,
          name: t('permissions.sendVerificationEmails'),
          description: t('permissions.sendVerificationEmailsDesc')
        }
      ]
    },
    {
      title: t('permissions.identities'),
      permissions: [
        {
          key: 'canListIdentities' as keyof SESPermissions,
          name: t('permissions.listIdentities'),
          description: t('permissions.listIdentitiesDesc')
        },
        {
          key: 'canVerifyIdentities' as keyof SESPermissions,
          name: t('permissions.verifyIdentities'),
          description: t('permissions.verifyIdentitiesDesc')
        },
        {
          key: 'canGetSendQuota' as keyof SESPermissions,
          name: t('permissions.getSendQuota'),
          description: t('permissions.getSendQuotaDesc')
        },
        {
          key: 'canGetSendRate' as keyof SESPermissions,
          name: t('permissions.getSendRate'),
          description: t('permissions.getSendRateDesc')
        }
      ]
    }
  ] : [
    {
      title: t('permissions.emailTemplates'),
      permissions: [
        {
          key: 'canListTemplates' as keyof SESPermissions,
          name: t('permissions.listTemplates'),
          description: t('permissions.listTemplatesDesc')
        },
        {
          key: 'canCreateTemplates' as keyof SESPermissions,
          name: t('permissions.createTemplates'),
          description: t('permissions.createTemplatesDesc')
        },
        {
          key: 'canSendEmails' as keyof SESPermissions,
          name: t('permissions.sendEmails'),
          description: t('permissions.sendEmailsDesc')
        }
      ]
    },
    {
      title: t('permissions.verificationTemplates'),
      permissions: [
        {
          key: 'canListVerificationTemplates' as keyof SESPermissions,
          name: t('permissions.listVerificationTemplates'),
          description: t('permissions.listVerificationTemplatesDesc')
        },
        {
          key: 'canCreateVerificationTemplates' as keyof SESPermissions,
          name: t('permissions.createVerificationTemplates'),
          description: t('permissions.createVerificationTemplatesDesc')
        }
      ]
    },
    {
      title: t('permissions.identities'),
      permissions: [
        {
          key: 'canListIdentities' as keyof SESPermissions,
          name: t('permissions.listIdentities'),
          description: t('permissions.listIdentitiesDesc')
        },
        {
          key: 'canGetSendQuota' as keyof SESPermissions,
          name: t('permissions.getSendQuota'),
          description: t('permissions.getSendQuotaDesc')
        }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('permissions.title')}
            </CardTitle>
            <CardDescription>
              Conta: {permissions.callerIdentity.Account} | Usuário: {permissions.callerIdentity.UserId}
            </CardDescription>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('permissions.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {permissionGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-lg font-semibold mb-3">{group.title}</h3>
            <div className="space-y-2">
              {group.permissions.map((perm, permIndex) => (
                <PermissionItem
                  key={permIndex}
                  permission={perm.name}
                  allowed={permissions.permissions[perm.key]}
                  description={perm.description}
                  allowedText={t('permissions.allowed')}
                  deniedText={t('permissions.denied')}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { PermissionsStatus } from '@/components/ui/permissions-status';
import { Mail, Cloud, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('common.welcome')} ✈️</h1>
        <p className="text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t('dashboard.emailTemplates')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.emailTemplatesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">0</span>
              <Badge variant="outline">{t('dashboard.local')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('dashboard.verificationTemplates')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.verificationTemplatesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">0</span>
              <Badge variant="outline">{t('dashboard.local')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              {t('dashboard.awsStatus')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.awsStatusDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="default">{t('dashboard.connected')}</Badge>
              <Badge variant="outline">{t('dashboard.online')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-6">
        <PermissionsStatus />
      </div>
    </div>
  );
}
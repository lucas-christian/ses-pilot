'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';
import { useTranslation } from '@/lib/i18n';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TestEmailModalProps {
  templatePath: string;
  isVerification?: boolean;
  children: React.ReactNode;
}

export function TestEmailModal({
  templatePath,
  // isVerification = false,
  children }: TestEmailModalProps
) {
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTest = async () => {
    if (!email.trim()) {
      toast.error(t('testEmail.emailRequired'));
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('testEmail.invalidEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const apiPath = `/api/verification-templates/${templatePath}?action=test-email`;

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('testEmail.success'));
        setIsOpen(false);
        setEmail('');
      } else {
        toast.error(data.error || t('testEmail.error'));
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail de teste:', error);
      toast.error(t('testEmail.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open);
      if (!open) {
        setEmail('');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t('testEmail.title')}
          </DialogTitle>
          <DialogDescription>
            {t('testEmail.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="test-email" className="text-sm font-medium">
              E-mail de destino
            </label>
            <Input
              id="test-email"
              type="email"
              placeholder={t('testEmail.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendTest}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('testEmail.sending')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('testEmail.sendButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

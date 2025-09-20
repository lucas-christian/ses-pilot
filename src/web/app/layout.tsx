import { Sidebar } from '@/components/layout/sidebar';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import React from 'react';
import { Toaster } from 'sonner';
import './globals.css'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SES Pilot',
  description: 'Pilot para o SES',
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <div className="flex h-screen bg-background">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
              <Toaster richColors />
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

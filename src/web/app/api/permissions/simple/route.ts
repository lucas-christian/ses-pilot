import { NextResponse } from 'next/server';
import { execa } from 'execa';

interface SimplePermissions {
  canListTemplates: boolean;
  canCreateTemplates: boolean;
  canSendEmails: boolean;
  canListVerificationTemplates: boolean;
  canCreateVerificationTemplates: boolean;
  canListIdentities: boolean;
  canGetSendQuota: boolean;
}

export async function GET() {
  try {
    // Verifica se o AWS CLI está configurado
    let callerIdentity;
    try {
      const { stdout } = await execa('aws', ['sts', 'get-caller-identity']);
      callerIdentity = JSON.parse(stdout);
    } catch (error) {
      return NextResponse.json({
        error: 'AWS CLI não configurado ou credenciais inválidas',
        permissions: null
      }, { status: 401 });
    }

    // Testa permissões básicas de forma mais simples
    const permissions: SimplePermissions = {
      canListTemplates: false,
      canCreateTemplates: false,
      canSendEmails: false,
      canListVerificationTemplates: false,
      canCreateVerificationTemplates: false,
      canListIdentities: false,
      canGetSendQuota: false
    };

    // Testa listar templates
    try {
      await execa('aws', ['sesv2', 'list-email-templates', '--max-items', '1']);
      permissions.canListTemplates = true;
    } catch (error) {
      // Se falhar, não tem permissão
    }

    // Testa listar templates de verificação
    try {
      await execa('aws', ['sesv2', 'list-custom-verification-email-templates', '--max-items', '1']);
      permissions.canListVerificationTemplates = true;
    } catch (error) {
      // Se falhar, não tem permissão
    }

    // Testa listar identidades
    try {
      await execa('aws', ['sesv2', 'list-identities', '--max-items', '1']);
      permissions.canListIdentities = true;
    } catch (error) {
      // Se falhar, não tem permissão
    }

    // Testa obter cota de envio
    try {
      await execa('aws', ['sesv2', 'get-send-quota']);
      permissions.canGetSendQuota = true;
    } catch (error) {
      // Se falhar, não tem permissão
    }

    // Testa criar template (comando que falha mas mostra se tem permissão)
    try {
      await execa('aws', ['sesv2', 'create-email-template', '--template-name', 'test-permission-check', '--template-content', 'Subject=Test,Html=<p>Test</p>']);
      permissions.canCreateTemplates = true;
    } catch (error) {
      const errorMessage = (error as { stderr?: string }).stderr || '';
      // Se o erro for de permissão, não tem permissão
      if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
        permissions.canCreateTemplates = false;
      } else {
        // Se o erro for por outros motivos (template já existe, etc.), tem permissão
        permissions.canCreateTemplates = true;
      }
    }

    // Testa criar template de verificação
    try {
      await execa('aws', ['sesv2', 'create-custom-verification-email-template', '--template-name', 'test-permission-check', '--from-email-address', 'test@example.com', '--template-subject', 'Test', '--template-content', '<p>Test</p>']);
      permissions.canCreateVerificationTemplates = true;
    } catch (error) {
      const errorMessage = (error as { stderr?: string }).stderr || '';
      if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
        permissions.canCreateVerificationTemplates = false;
      } else {
        permissions.canCreateVerificationTemplates = true;
      }
    }

    // Testa enviar e-mail (comando que falha mas mostra se tem permissão)
    try {
      await execa('aws', ['sesv2', 'send-email', '--from', 'test@example.com', '--to', 'test@example.com', '--subject', 'Test', '--message', 'Body={Text={Data=Test}}']);
      permissions.canSendEmails = true;
    } catch (error) {
      const errorMessage = (error as { stderr?: string }).stderr || '';
      if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
        permissions.canSendEmails = false;
      } else {
        // Se o erro for por outros motivos (e-mail não verificado, etc.), tem permissão
        permissions.canSendEmails = true;
      }
    }

    return NextResponse.json({
      callerIdentity,
      permissions,
      message: 'Permissões verificadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return NextResponse.json({
      error: 'Falha ao verificar permissões',
      permissions: null
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { execa } from 'execa';

interface PermissionCheck {
  permission: string;
  allowed: boolean;
  reason?: string;
}

interface SESPermissions {
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

    // Lista de permissões para verificar
    const permissionsToCheck = [
      'ses:ListEmailTemplates',
      'ses:CreateEmailTemplate',
      'ses:UpdateEmailTemplate',
      'ses:DeleteEmailTemplate',
      'ses:SendEmail',
      'ses:ListCustomVerificationEmailTemplates',
      'ses:CreateCustomVerificationEmailTemplate',
      'ses:UpdateCustomVerificationEmailTemplate',
      'ses:DeleteCustomVerificationEmailTemplate',
      'ses:SendCustomVerificationEmail',
      'ses:ListIdentities',
      'ses:VerifyEmailIdentity',
      'ses:GetSendQuota',
      'ses:GetSendRate'
    ];

    const permissionResults: PermissionCheck[] = [];

    // Verifica cada permissão testando comandos reais (mais confiável)
    for (const permission of permissionsToCheck) {
      try {
        let isAllowed = false;
        let reason = 'Não testado';

        // Testa comandos específicos baseados na permissão
        switch (permission) {
          case 'ses:ListEmailTemplates':
            try {
              await execa('aws', ['sesv2', 'list-email-templates', '--max-items', '1']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:CreateEmailTemplate':
            // Testa se consegue criar um template temporário
            try {
              const testTemplate = {
                TemplateName: 'test-permission-check',
                TemplateContent: {
                  Subject: 'Test',
                  Html: '<p>Test</p>'
                }
              };
              const tempFile = `/tmp/test-template-${Date.now()}.json`;
              await execa('aws', ['sesv2', 'create-email-template', '--cli-input-json', `file://${tempFile}`]);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:UpdateEmailTemplate':
            // Testa se consegue atualizar um template (mesmo que não exista)
            try {
              await execa('aws', ['sesv2', 'update-email-template', '--template-name', 'test-permission-check', '--template-content', 'Subject=Test,Html=<p>Test</p>']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:DeleteEmailTemplate':
            // Testa se consegue deletar um template (mesmo que não exista)
            try {
              await execa('aws', ['sesv2', 'delete-email-template', '--template-name', 'test-permission-check']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:SendEmail':
            // Testa se consegue enviar e-mail (mesmo que falhe por outros motivos)
            try {
              await execa('aws', ['sesv2', 'send-email', '--from', 'test@example.com', '--to', 'test@example.com', '--subject', 'Test', '--message', 'Body={Text={Data=Test}}']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              // Se o erro for de permissão, não tem permissão
              const errorMessage = (error as { stderr?: string }).stderr || '';
              if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
                isAllowed = false;
                reason = 'Acesso negado';
              } else {
                // Se o erro for por outros motivos (e-mail não verificado, etc.), tem permissão
                isAllowed = true;
                reason = 'Permissão OK (erro por outros motivos)';
              }
            }
            break;

          case 'ses:ListCustomVerificationEmailTemplates':
            try {
              await execa('aws', ['sesv2', 'list-custom-verification-email-templates', '--max-items', '1']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:CreateCustomVerificationEmailTemplate':
            try {
              await execa('aws', ['sesv2', 'create-custom-verification-email-template', '--template-name', 'test-permission-check', '--from-email-address', 'test@example.com', '--template-subject', 'Test', '--template-content', '<p>Test</p>']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:UpdateCustomVerificationEmailTemplate':
            try {
              await execa('aws', ['sesv2', 'update-custom-verification-email-template', '--template-name', 'test-permission-check', '--template-subject', 'Test', '--template-content', '<p>Test</p>']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:DeleteCustomVerificationEmailTemplate':
            try {
              await execa('aws', ['sesv2', 'delete-custom-verification-email-template', '--template-name', 'test-permission-check']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:SendCustomVerificationEmail':
            try {
              await execa('aws', ['sesv2', 'send-custom-verification-email', '--email-address', 'test@example.com', '--template-name', 'test-permission-check']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:ListIdentities':
            try {
              await execa('aws', ['sesv2', 'list-identities', '--max-items', '1']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:VerifyEmailIdentity':
            try {
              await execa('aws', ['sesv2', 'verify-email-identity', '--email-address', 'test@example.com']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:GetSendQuota':
            try {
              await execa('aws', ['sesv2', 'get-send-quota']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          case 'ses:GetSendRate':
            try {
              await execa('aws', ['sesv2', 'get-send-rate']);
              isAllowed = true;
              reason = 'Comando executado com sucesso';
            } catch (error) {
              isAllowed = false;
              reason = 'Comando falhou';
            }
            break;

          default:
            isAllowed = false;
            reason = 'Permissão não testada';
        }
        
        permissionResults.push({
          permission,
          allowed: isAllowed,
          reason
        });
      } catch (error) {
        // Se não conseguir verificar a permissão específica, assume que não tem
        permissionResults.push({
          permission,
          allowed: false,
          reason: 'Erro ao testar'
        });
      }
    }

    // Mapeia os resultados para o formato de permissões do SES
    const sesPermissions: SESPermissions = {
      canListTemplates: permissionResults.find(p => p.permission === 'ses:ListEmailTemplates')?.allowed || false,
      canCreateTemplates: permissionResults.find(p => p.permission === 'ses:CreateEmailTemplate')?.allowed || false,
      canUpdateTemplates: permissionResults.find(p => p.permission === 'ses:UpdateEmailTemplate')?.allowed || false,
      canDeleteTemplates: permissionResults.find(p => p.permission === 'ses:DeleteEmailTemplate')?.allowed || false,
      canSendEmails: permissionResults.find(p => p.permission === 'ses:SendEmail')?.allowed || false,
      canListVerificationTemplates: permissionResults.find(p => p.permission === 'ses:ListCustomVerificationEmailTemplates')?.allowed || false,
      canCreateVerificationTemplates: permissionResults.find(p => p.permission === 'ses:CreateCustomVerificationEmailTemplate')?.allowed || false,
      canUpdateVerificationTemplates: permissionResults.find(p => p.permission === 'ses:UpdateCustomVerificationEmailTemplate')?.allowed || false,
      canDeleteVerificationTemplates: permissionResults.find(p => p.permission === 'ses:DeleteCustomVerificationEmailTemplate')?.allowed || false,
      canSendVerificationEmails: permissionResults.find(p => p.permission === 'ses:SendCustomVerificationEmail')?.allowed || false,
      canListIdentities: permissionResults.find(p => p.permission === 'ses:ListIdentities')?.allowed || false,
      canVerifyIdentities: permissionResults.find(p => p.permission === 'ses:VerifyEmailIdentity')?.allowed || false,
      canGetSendQuota: permissionResults.find(p => p.permission === 'ses:GetSendQuota')?.allowed || false,
      canGetSendRate: permissionResults.find(p => p.permission === 'ses:GetSendRate')?.allowed || false
    };

    return NextResponse.json({
      callerIdentity,
      permissions: sesPermissions,
      details: permissionResults
    });

  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return NextResponse.json({
      error: 'Falha ao verificar permissões',
      permissions: null
    }, { status: 500 });
  }
}

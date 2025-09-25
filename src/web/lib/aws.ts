import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

/**
 * Faz o deploy de um template para a AWS SES v2.
 * Ele replica a lógica do script PowerShell para formatar o HTML.
 * @param templateDetails O conteúdo HTML e JSON do template lido do disco.
 */
export async function deployTemplate(templateDetails: { htmlContent: string; templateJson: { Template: { TemplateName: string; SubjectPart: string; }; } }) {
  const { Template } = templateDetails.templateJson;
  const { TemplateName } = Template;

  if (!TemplateName) {
    throw new Error('O nome do template (TemplateName) não foi encontrado no template.json.');
  }
  

  // 1. Replica a lógica do PowerShell para colocar o HTML em uma linha única.
  const oneLineHtml = templateDetails.htmlContent
    .replace(/\r?\n/g, '')      // Remove todas as quebras de linha (CRLF e LF)
    .replace(/\s{2,}/g, ' ')  // Substitui 2 ou mais espaços/tabs por um único espaço
    .trim();                  // Remove espaços no início e no fim
    

  // 2. Prepara o payload JSON para a AWS CLI.
  const awsTemplatePayload = {
    TemplateName,
    TemplateContent: {
      Subject: Template.SubjectPart,
      Html: oneLineHtml,
    },
  };
  
  
  // 3. Salva o payload em arquivo temporário
  const tempJsonPath = path.join(os.tmpdir(), `ses-pilot-${Date.now()}.json`);
  await fs.writeJson(tempJsonPath, awsTemplatePayload);

  try {
    // 4. Verifica se o template já existe na AWS
    try {
      await execa('aws', ['sesv2', 'get-email-template', '--template-name', TemplateName]);
      // Se não deu erro, o template existe. Vamos atualizá-lo.
      await execa('aws', ['sesv2', 'update-email-template', '--cli-input-json', `file://${tempJsonPath}`]);
    } catch (error: unknown) {
      // Se o erro contém "NotFoundException", o template não existe. Vamos criá-lo.
      const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
      if (errorMessage.includes('NotFoundException')) {
        await execa('aws', ['sesv2', 'create-email-template', '--cli-input-json', `file://${tempJsonPath}`]);
      } else {
        // Se for outro tipo de erro no 'get', relança para ser pego pelo catch principal.
        throw error;
      }
    }
  } catch (error: unknown) {
    // Captura erros do 'create' ou 'update' e os torna mais legíveis
    console.error("Erro ao executar comando da AWS CLI:", error);
    const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
    throw new Error(`Falha no deploy via AWS CLI: ${errorMessage}`);
  } finally {
    // 5. Garante que o arquivo temporário seja sempre deletado
    await fs.remove(tempJsonPath);
  }
}

/**
 * Faz o deploy de um template de verificação para a AWS SES.
 * @param templateDetails - Detalhes do template de verificação.
 */
export async function deployVerificationTemplate(templateDetails: { 
  htmlContent: string; 
  templateJson: { 
    Template: { 
      TemplateName: string; 
      SubjectPart: string; 
      HtmlPart?: string;
      TextPart?: string;
    }; 
  } 
}) {
  const { execa } = await import('execa');
  const fs = await import('fs-extra');
  const path = await import('path');
  const os = await import('os');

  try {
    // Prepara o payload para o template de verificação
    const verificationPayload = {
      TemplateName: templateDetails.templateJson.Template.TemplateName,
      FromEmailAddress: process.env.AWS_SES_FROM_EMAIL || 'noreply@example.com',
      TemplateSubject: templateDetails.templateJson.Template.SubjectPart,
      TemplateContent: {
        Html: templateDetails.htmlContent || templateDetails.templateJson.Template.HtmlPart || '',
        Text: templateDetails.templateJson.Template.TextPart || ''
      },
      SuccessRedirectionURL: process.env.AWS_SES_SUCCESS_REDIRECT_URL || '',
      FailureRedirectionURL: process.env.AWS_SES_FAILURE_REDIRECT_URL || ''
    };

    // Salva o payload em arquivo temporário
    const tempJsonPath = path.join(os.tmpdir(), `ses-verification-template-${Date.now()}.json`);
    await fs.writeJson(tempJsonPath, verificationPayload);

    try {
      // Executa o comando de criação/atualização do template de verificação
      await execa('aws', ['sesv2', 'create-custom-verification-email-template', '--cli-input-json', `file://${tempJsonPath}`]);
    } catch (createError) {
      // Se falhar na criação, tenta atualizar
      try {
        await execa('aws', ['sesv2', 'update-custom-verification-email-template', '--cli-input-json', `file://${tempJsonPath}`]);
      } catch {
        throw createError; // Re-throw o erro original se ambos falharem
      }
    } finally {
      // Remove o arquivo temporário
      try {
        await fs.remove(tempJsonPath);
      } catch (cleanupError) {
        console.warn('Erro ao remover arquivo temporário:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Erro ao fazer deploy do template de verificação:', error);
    throw new Error(`Falha no deploy do template de verificação: ${(error as { message?: string }).message || 'Erro desconhecido'}`);
  }
}

interface RemoteTemplate {
  TemplateName: string;
  LastUpdatedTimestamp: string;
}

/**
 * Lista todos os templates de e-mail da conta AWS SES.
 * Lida com a paginação da AWS CLI.
 * @returns Uma promessa que resolve para um array de templates remotos.
 */
export async function listRemoteTemplates(): Promise<RemoteTemplate[]> {
  const allTemplates: RemoteTemplate[] = [];
  let nextToken: string | undefined = undefined;

  try {
    do {
      const args = ['sesv2', 'list-email-templates'];
      if (nextToken) {
        args.push('--next-token', nextToken);
      }

      const { stdout } = await execa('aws', args);
      const result = JSON.parse(stdout);

      if (result.TemplatesMetadata) {
        allTemplates.push(...result.TemplatesMetadata);
      }
      nextToken = result.NextToken;
    } while (nextToken);

    return allTemplates;
  } catch (error: unknown) {
    console.error("Erro ao listar templates da AWS:", error);
    // Se não houver templates, a AWS pode retornar um erro. Tratamos como lista vazia.
    const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
    if (errorMessage.includes('No templates found')) {
      return [];
    }
    throw new Error(`Falha ao listar templates da AWS: ${errorMessage}`);
  }
}

/**
 * Busca o conteúdo completo de um template específico da AWS.
 * @param templateName O nome do template na AWS.
 * @returns O conteúdo do template (Assunto e HTML).
 */
export async function getRemoteTemplateContent(templateName: string) {
  try {
    
    // Primeiro tenta como template regular
    try {
      const { stdout } = await execa('aws', ['sesv2', 'get-email-template', '--template-name', templateName]);
      const result = JSON.parse(stdout);
      const content = result.TemplateContent;
      if (!content || !content.Html || !content.Subject) {
        throw new Error('A resposta da AWS não contém o conteúdo esperado.');
      }
      return {
        Subject: content.Subject,
        Html: content.Html,
      };
    } catch {
      // Se falhar, tenta como template de verificação
      const { stdout } = await execa('aws', ['sesv2', 'get-custom-verification-email-template', '--template-name', templateName]);
      const result = JSON.parse(stdout);
      
      if (!result.TemplateContent || !result.TemplateSubject) {
        throw new Error('A resposta da AWS não contém o conteúdo esperado.');
      }
      return {
        Subject: result.TemplateSubject,
        Html: result.TemplateContent,
        FromEmailAddress: result.FromEmailAddress,
        SuccessRedirectionURL: result.SuccessRedirectionURL,
        FailureRedirectionURL: result.FailureRedirectionURL,
      };
    }
  } catch (error: unknown) {
    console.error(`Erro ao buscar conteúdo do template "${templateName}":`, error);
    const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
    throw new Error(`Falha ao buscar conteúdo da AWS: ${errorMessage}`);
  }
}

interface RemoteVerificationTemplate {
  TemplateName: string;
  FromEmailAddress: string;
  Subject: string;
}

/**
 * Lista todos os templates de e-mail de verificação customizados da conta AWS SES.
 * Lida com a paginação da AWS CLI.
 * @returns Uma promessa que resolve para um array de templates de verificação remotos.
 */
export async function listRemoteVerificationTemplates(): Promise<RemoteVerificationTemplate[]> {
  const allTemplates: RemoteVerificationTemplate[] = [];
  let nextToken: string | undefined = undefined;

  try {
    do {
      const args = ['sesv2', 'list-custom-verification-email-templates'];
      if (nextToken) {
        args.push('--next-token', nextToken);
      }

      const { stdout } = await execa('aws', args);
      const result = JSON.parse(stdout);

      if (result.CustomVerificationEmailTemplates) {
        allTemplates.push(...result.CustomVerificationEmailTemplates);
      }
      nextToken = result.NextToken;
    } while (nextToken);

    return allTemplates;
  } catch (error: unknown) {
    console.error("Erro ao listar templates de verificação da AWS:", error);
    // Este comando não parece dar erro se a lista for vazia, mas mantemos a segurança
    const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || '';
    if (errorMessage.includes('No templates found')) {
      return [];
    }
    throw new Error(`Falha ao listar templates de verificação da AWS: ${errorMessage}`);
  }
}
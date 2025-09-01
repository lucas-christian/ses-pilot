#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { minify } from 'html-minifier-terser';
import open from 'open';
import { loadLanguage, t, saveLanguage } from './i18n.js';
import { fileURLToPath } from 'url';

// Funções de utilidade para exibir mensagens coloridas
const log = console.log;
const logInfo = (message) => log(chalk.cyan.bold(message));
const logSuccess = (message) => log(chalk.green.bold(message));
const logError = (message) => log(chalk.red.bold(message));
const logWarning = (message) => log(chalk.yellow(message));

const EMAILS_DIR_NAME = 'emails';

async function runCommand(command, args, options = {}) {
  try {
    const subprocess = execa(command, args, options);
    subprocess.stdout?.pipe(process.stdout);
    subprocess.stderr?.pipe(process.stderr);
    await subprocess;
    return { success: true };
  } catch (error) {
    logError(`\nOcorreu um erro ao executar o comando: ${command} ${args.join(' ')}`);
    return { success: false };
  }
}

async function handleCreateNewTemplate(emailsDir) {
    console.clear();
    logInfo(`✨ ${t('create_new_template_title')}\n`);

    const { templateDirName } = await inquirer.prompt({
        type: 'input', name: 'templateDirName', message: t('prompt_template_dir_name'),
        validate: input => {
            if (!input) return t('validation_cannot_be_empty');
            if (fs.existsSync(path.join(emailsDir, input))) return t('validation_dir_exists');
            return true;
        },
        filter: input => input.toLowerCase().replace(/\s+/g, '-'),
    });

    const defaultAwsName = templateDirName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    const { templateName } = await inquirer.prompt({
        type: 'input', name: 'templateName', message: t('prompt_aws_template_name'),
        default: `${defaultAwsName}Template`, validate: input => !!input || t('validation_cannot_be_empty'),
    });
    
    const { subjectPart } = await inquirer.prompt({
        type: 'input', name: 'subjectPart', message: t('prompt_email_subject'),
        default: 'An email from our app', validate: input => !!input || t('validation_cannot_be_empty'),
    });

    try {
        const fullTemplatePath = path.join(emailsDir, templateDirName);
        logInfo(`\n1. ${t('creating_directory', { dir: path.join(EMAILS_DIR_NAME, templateDirName) })}`);
        await fs.mkdir(fullTemplatePath);

        const boilerplatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'boilerplate', 'template.html.stub');
        let htmlContent = await fs.readFile(boilerplatePath, 'utf-8');
        htmlContent = htmlContent.replace(/{{subjectPart}}/g, subjectPart).replace(/{{templateName}}/g, templateName);
        
        const jsonContent = { Template: { TemplateName: templateName, SubjectPart: subjectPart, HtmlPart: "" } };
        const sendJsonContent = {
            Source: "Your Verified Email <sender@example.com>", Template: templateName,
            Destination: { ToAddresses: ["recipient@example.com"] },
            TemplateData: JSON.stringify({ name: "Test User", code: "123456" })
        };
        
        logInfo(`2. ${t('creating_file', { file: 'template.html' })}`);
        await fs.writeFile(path.join(fullTemplatePath, 'template.html'), htmlContent);
        logInfo(`3. ${t('creating_file', { file: 'template.json' })}`);
        await fs.writeJson(path.join(fullTemplatePath, 'template.json'), jsonContent, { spaces: 2 });
        logInfo(`4. ${t('creating_file', { file: 'send-email.json' })}`);
        await fs.writeJson(path.join(fullTemplatePath, 'send-email.json'), sendJsonContent, { spaces: 2 });
        
        logSuccess(`\n${t('template_created_successfully', { dir: templateDirName })}`);

        const { nextAction } = await inquirer.prompt({
            type: 'list', name: 'nextAction', message: t('prompt_next_action'),
            choices: [
                { name: t('action_edit'), value: 'edit' },
                { name: t('action_preview'), value: 'preview' },
                new inquirer.Separator(),
                { name: t('action_back'), value: 'back' },
            ]
        });

        if (nextAction === 'edit') {
            await handleEdit(fullTemplatePath);
        } else if (nextAction === 'preview') {
            await handlePreview(fullTemplatePath);
        }

    } catch (error) {
        logError(t('unexpected_error'));
        console.error(error);
    }
}

async function handleCreateUpdate(fullTemplatePath) {
  const templateDirName = path.basename(fullTemplatePath);
  logInfo(t('create_update_start', { templateDir: templateDirName }));

  const htmlPath = path.join(fullTemplatePath, 'template.html');
  const jsonPath = path.join(fullTemplatePath, 'template.json');
  
  logInfo(t('reading_and_formatting_html'));
  const htmlContent = await fs.readFile(htmlPath, 'utf-8');
  const minifiedHtml = await minify(htmlContent, { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true });

  logInfo(t('updating_json_with_html'));
  const templateJson = await fs.readJson(jsonPath);
  templateJson.Template.HtmlPart = minifiedHtml;

  const templateName = templateJson.Template.TemplateName;
  const tempJsonPath = path.join(fullTemplatePath, 'temp-template-for-aws.json');
  await fs.writeJson(tempJsonPath, templateJson);

  logInfo(t('checking_template_exists', { templateName }));
  const { stdout } = await execa('aws', ['ses', 'get-template', '--template-name', templateName]).catch(() => ({ stdout: null }));

  let result;
  if (stdout && stdout.includes(templateName)) {
    logInfo(t('template_found_updating', { templateName }));
    result = await runCommand('aws', ['ses', 'update-template', '--cli-input-json', `file://${tempJsonPath}`]);
  } else {
    logInfo(t('template_not_found_creating', { templateName }));
    result = await runCommand('aws', ['ses', 'create-template', '--cli-input-json', `file://${tempJsonPath}`]);
  }

  await fs.remove(tempJsonPath);

  if (result.success) {
    logSuccess(`\n${t('template_processed_successfully')}`);
  } else {
    logError(`\n${t('template_process_failed')}`);
  }
}

async function handleDelete(fullTemplatePath) {
    const templateDirName = path.basename(fullTemplatePath);
    logInfo(t('delete_start', { templateDir: templateDirName }));
    const jsonPath = path.join(fullTemplatePath, 'template.json');
    const templateJson = await fs.readJson(jsonPath);
    const templateName = templateJson.Template.TemplateName;

    const { confirmDelete } = await inquirer.prompt({
        type: 'confirm', name: 'confirmDelete',
        message: t('delete_confirm', { templateName: chalk.yellow.bold(templateName) }),
        default: false,
    });

    if (confirmDelete) {
        logInfo(t('deleting_template', { templateName }));
        const result = await runCommand('aws', ['ses', 'delete-template', '--template-name', templateName]);

        if (result.success) {
            logSuccess(t('delete_success_aws'));
            const { deleteFolder } = await inquirer.prompt({
                type: 'confirm', name: 'deleteFolder',
                message: t('delete_folder_prompt', { templateDir: chalk.yellow.bold(templateDirName) }),
                default: false,
            });

            if (deleteFolder) {
                logInfo(t('deleting_local_folder', { templateDir: templateDirName }));
                await fs.remove(fullTemplatePath);
                logSuccess(t('local_folder_deleted'));
            }
            // AVISO DE SUCESSO: Retorna 'true' para o chamador.
            return true;
        } else {
            logError(t('template_process_failed'));
            return false;
        }
    } else {
        logInfo(t('delete_cancelled'));
        return false;
    }
}

async function handlePreview(fullTemplatePath) {
    const htmlPath = path.join(fullTemplatePath, 'template.html');

    const { browser } = await inquirer.prompt({
        type: 'list', name: 'browser', message: t('preview_browser_prompt'),
        choices: [
            { name: t('default_browser'), value: 'default' }, new inquirer.Separator(),
            { name: 'Google Chrome', value: 'chrome' }, { name: 'Mozilla Firefox', value: 'firefox' }, { name: 'Microsoft Edge', value: 'msedge' },
        ],
    });

    try {
        logInfo(t('opening_file', { filePath: htmlPath }));
        await open(htmlPath, browser !== 'default' ? { app: { name: open.apps[browser] } } : undefined);
        logSuccess(t('preview_open_success'));
    } catch (error) {
        logError(t('preview_open_failed'));
        logWarning(t('preview_fallback'));
        await open(htmlPath);
    }
}

async function handleEdit(fullTemplatePath) {
    const htmlPath = path.join(fullTemplatePath, 'template.html');
    logInfo(t('edit_vscode_start'));
    logWarning(t('edit_vscode_warning'));
    await runCommand('code', [htmlPath]);
}

async function handleSendTest(fullTemplatePath) {
    const jsonPath = path.join(fullTemplatePath, 'send-email.json');
    logInfo(t('send_test_start', { jsonPath }));
    const result = await runCommand('aws', ['ses', 'send-templated-email', '--cli-input-json', `file://${jsonPath}`]);

    if (result.success) {
        logSuccess(`\n${t('send_test_success')}`);
        logWarning(t('send_test_check_inbox'));
    } else {
        logError(`\n${t('send_test_failed')}`);
    }
}

async function showTemplateMenu(fullTemplatePath) {
    const templateDirName = path.basename(fullTemplatePath);
    const requiredFiles = {
        html: fs.existsSync(path.join(fullTemplatePath, 'template.html')),
        templateJson: fs.existsSync(path.join(fullTemplatePath, 'template.json')),
        sendJson: fs.existsSync(path.join(fullTemplatePath, 'send-email.json')),
    };
    const disabledOption = (name, reason) => ({ name: chalk.gray(`- ${name} (${reason})`), value: 'disabled', disabled: true });
    
    menuLoop: while (true) {
        console.clear();
        log(chalk.yellow.bold('==================================================='));
        log(chalk.yellow.bold(`   ${t('managing_template_title', { templateDir: chalk.white(templateDirName) })}`));
        log(chalk.yellow.bold('===================================================\n'));

        const choices = [
            requiredFiles.templateJson && requiredFiles.html ? { name: t('action_create_update'), value: 'create_update' } : disabledOption(t('action_create_update'), t(!requiredFiles.templateJson ? 'reason_missing_template_json' : 'reason_missing_html')),
            requiredFiles.sendJson ? { name: t('action_send_test'), value: 'send_test' } : disabledOption(t('action_send_test'), t('reason_missing_send_json')),
            requiredFiles.html ? { name: t('action_preview'), value: 'preview' } : disabledOption(t('action_preview'), t('reason_missing_html')),
            requiredFiles.html ? { name: t('action_edit'), value: 'edit' } : disabledOption(t('action_edit'), t('reason_missing_html')),
            requiredFiles.templateJson ? { name: t('action_delete'), value: 'delete' } : disabledOption(t('action_delete'), t('reason_missing_template_json')),
            new inquirer.Separator(),
            { name: t('action_back'), value: 'back' },
        ];
        const { action } = await inquirer.prompt({ type: 'list', name: 'action', message: t('action_prompt'), choices });

        if (action === 'back') break menuLoop;
        if (action === 'disabled') continue menuLoop;
        
        console.clear();
        log(chalk.yellow.bold('===================================================\n'));

        let shouldReturnToMain = false;

        switch (action) {
            case 'create_update': await handleCreateUpdate(fullTemplatePath); break;
            case 'delete':
                const wasDeleted = await handleDelete(fullTemplatePath);
                if (wasDeleted) {
                    logInfo(`\n${t('returning_to_main_menu')}`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    shouldReturnToMain = true;
                }
                break;
            case 'preview': await handlePreview(fullTemplatePath); break;
            case 'edit': await handleEdit(fullTemplatePath); break;
            case 'send_test': await handleSendTest(fullTemplatePath); break;
        }

        if (shouldReturnToMain) {
            break menuLoop;
        }

        await inquirer.prompt({ type: 'input', name: 'continue', message: `\n${t('press_enter_to_continue')}` });
    }
}

async function handleChangeLanguage() {
    console.clear();
    const { selectedLang } = await inquirer.prompt([{
        type: 'list', name: 'selectedLang', message: 'Please select your preferred language:',
        choices: [ { name: 'English', value: 'en' }, { name: 'Português', value: 'pt' } ],
    }]);
    await saveLanguage(selectedLang);
    await loadLanguage();
    logSuccess(`\n${t('language_changed_successfully')}`);
    await inquirer.prompt({ type: 'input', name: 'continue', message: `\n${t('press_enter_to_continue')}` });
}

async function main() {
    await loadLanguage();

    try { await execa('aws', ['--version']); }
    catch (error) { logError(t('aws_cli_not_found')); logInfo(t('aws_cli_guide')); return; }

    const emailsDir = path.resolve(process.cwd(), EMAILS_DIR_NAME);
    if (!fs.existsSync(emailsDir)) {
        const { createDir } = await inquirer.prompt({
            type: 'confirm', name: 'createDir', message: t('prompt_create_emails_dir', { dir: EMAILS_DIR_NAME }), default: true
        });
        if (createDir) {
            await fs.mkdir(emailsDir);
            logSuccess(t('emails_dir_created', { dir: EMAILS_DIR_NAME }));
        } else {
            logError(t('emails_dir_required'));
            return;
        }
    }

    mainLoop: while (true) {
        console.clear();
        const title = t('welcome_title');
        const border = '#'.repeat(title.length + 8);
        log(chalk.blue.bold(border));
        log(chalk.blue.bold(`##   ${title}   ##`));
        log(chalk.blue.bold(border + '\n'));
        
        const templateDirs = await fs.readdir(emailsDir, { withFileTypes: true })
            .then(dirents => dirents.filter(d => d.isDirectory()).map(d => d.name));
        
        const { selectedChoice } = await inquirer.prompt({
            type: 'list', name: 'selectedChoice', message: t('select_template_prompt'),
            choices: [
                { name: `✨ ${t('action_create_new')}`, value: 'create_new' },
                new inquirer.Separator(templateDirs.length > 0 ? '----- Templates -----' : ' '),
                ...templateDirs,
                new inquirer.Separator(),
                { name: `⚙️  ${t('action_change_language')}`, value: 'change_language' },
                { name: `🚪 ${t('exit_program')}`, value: 'exit' },
            ],
        });

        switch (selectedChoice) {
            case 'exit': break mainLoop;
            case 'create_new': await handleCreateNewTemplate(emailsDir); continue mainLoop;
            case 'change_language': await handleChangeLanguage(); continue mainLoop;
            default:
                const fullTemplatePath = path.join(emailsDir, selectedChoice);
                await showTemplateMenu(fullTemplatePath);
                break;
        }
    }
}

main().catch(err => {
    logError(t('unexpected_error'));
    console.error(err);
});

process.on('SIGINT', () => {
    logInfo(`\n\n${t('goodbye_message')}`);
    process.exit(0);
});
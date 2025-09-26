#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import next from 'next';
import http from 'http';
import portfinder from 'portfinder';
import { parse } from 'url';
import { fileURLToPath } from 'url';

// Para compatibilidade com módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NEXT_PRIVATE_EXPERIMENTAL_HIDE_THE_TRACE = '1';

const program = new Command();

program
  .name('ses-pilot')
  .description('Uma ferramenta para gerenciar templates do AWS SES v2.')
  .version('1.0.0');

program.command('init')
  .description('Inicializa a configuração do ses-pilot (modo local ou global).')
  .action(async () => {
    console.log(chalk.blue.bold('✈️  Bem-vindo à configuração do SES Pilot!'));

    // const answers = await inquirer.prompt([
    //   {
    //     type: 'list',
    //     name: 'mode',
    //     message: 'Como você prefere gerenciar seus templates?',
    //     choices: [
    //       { name: 'Local: Gerenciar templates apenas para o projeto atual.', value: 'local' },
    //       { name: 'Global: Manter uma biblioteca central de templates.', value: 'global' },
    //     ],
    //   },
    //   {
    //     type: 'list',
    //     name: 'globalPathChoice',
    //     message: 'Onde você gostaria de armazenar os arquivos de configuração e templates globais?',
    //     choices: [
    //       { name: `Padrão: No seu diretório de usuário (${path.join(os.homedir(), '.ses-pilot')})`, value: 'default' },
    //       { name: 'Personalizado: Escolher um diretório específico', value: 'custom' }
    //     ],
    //     when: (answers) => answers.mode === 'global',
    //   },
    //   {
    //     type: 'input',
    //     name: 'customGlobalPath',
    //     message: 'Por favor, insira o caminho completo para o diretório (ex: /Users/seu-nome/Documentos/ses-templates):',
    //     when: (answers) => answers.globalPathChoice === 'custom',
    //     validate: (input) => !!input || 'O caminho не pode ser vazio.',
    //     filter: (input) => {
    //         return input.startsWith('~') ? path.join(os.homedir(), input.slice(1)) : input;
    //     }
    //   }
    // ]);

    try {
      // if (answers.mode === 'local') {
      const configPath = path.resolve(process.cwd(), 'ses-pilot.config.json');
      const templatesPath = path.resolve(process.cwd(), 'ses-templates');

      if (await fs.pathExists(configPath)) {
        console.log(chalk.yellow('Já existe um arquivo de configuração local. Nenhuma alteração foi feita.'));
        return;
      }

      const config = {
        mode: 'local',
        templatesPath: './ses-templates',
      };

      await fs.writeJson(configPath, config, { spaces: 2 });
      await fs.ensureDir(templatesPath);
      
      console.log(chalk.green('✔️ Configuração local criada com sucesso!'));
      console.log(chalk.cyan(`   - Arquivo de configuração: ${configPath}`));
      console.log(chalk.cyan(`   - Pasta de templates: ${templatesPath}`));

      // } else if (answers.mode === 'global') {
      //   const globalDir = answers.globalPathChoice === 'custom'
      //     ? path.resolve(answers.customGlobalPath)
      //     : path.join(os.homedir(), '.ses-pilot');

      //   const configPath = path.join(globalDir, 'config.json');
      //   const templatesPath = path.join(globalDir, 'templates');

      //   if (await fs.pathExists(configPath)) {
      //     console.log(chalk.yellow(`A configuração global já existe em ${globalDir}. Nenhuma alteração foi feita.`));
      //     return;
      //   }

      //   await fs.ensureDir(templatesPath); 

      //   const config = {
      //     mode: 'global',
      //     templatesPath: templatesPath,
      //   };
      //   await fs.writeJson(configPath, config, { spaces: 2 });

      //   console.log(chalk.green('✔️ Configuração global criada com sucesso!'));
      //   console.log(chalk.cyan(`   - Arquivos de configuração e templates estão em: ${globalDir}`));
      // }
    } catch (error: any) {
        if (error.code === 'EACCES') {
            console.error(chalk.red('\n❌ Erro de Permissão!'));
            console.error(chalk.yellow(`   O ses-pilot não tem permissão para escrever no diretório especificado.`));
            console.error(chalk.yellow(`   Por favor, verifique as permissões da pasta ou execute o comando com privilégios de administrador (se aplicável).`));
        } else {
            console.error(chalk.red('\n❌ Ocorreu um erro inesperado durante a inicialização:'));
            console.error(error);
        }
    }
  });

program.command('start')
  .description('Inicia a interface web de gerenciamento.')
  .action(async () => {
    console.log(chalk.cyan('✈️  Procurando configuração do SES Pilot...'));
    
    const localConfigPath = path.resolve(process.cwd(), 'ses-pilot.config.json');
    const globalConfigPath = path.join(os.homedir(), '.ses-pilot', 'config.json');

    let config;
    if (await fs.pathExists(localConfigPath)) {
      config = await fs.readJson(localConfigPath);
      config.templatesPath = path.resolve(process.cwd(), config.templatesPath);
      console.log(chalk.blue('✔️  Modo detectado: local'));
    } else if (await fs.pathExists(globalConfigPath)) {
      config = await fs.readJson(globalConfigPath);
      console.log(chalk.blue('✔️  Modo detectado: global'));
    }

    if (!config) {
      console.log(chalk.red('Nenhum arquivo de configuração encontrado.'));
      console.log(chalk.yellow('Por favor, rode `ses-pilot init` primeiro.'));
      return;
    }

    process.env.SES_PILOT_TEMPLATES_PATH = config.templatesPath;

    try {
      // Em produção, o web app estará no diretório dist/web
      const webAppPath = path.resolve(__dirname, './web');
      const port = await portfinder.getPortPromise({ port: 5359 });

      console.log(chalk.green('🚀 Iniciando a interface web... (Isso pode levar um momento)'));

      const app = next({ dev: false, dir: webAppPath });
      const handle = app.getRequestHandler();

      await app.prepare();

      const server = http.createServer((req, res) => {
        const parsedUrl = parse(req.url!, true); 
        handle(req, res, parsedUrl);
      });

      server.listen(port, () => {
        console.log(chalk.green.bold(`\n🎉 Servidor iniciado! Acesse no seu navegador:`));
        console.log(chalk.cyan.underline(`   > http://localhost:${port}\n`));
        console.log(`(Pressione ${chalk.yellow('Ctrl+C')} para parar o servidor)`);
      });

    } catch (error) {
      console.error(chalk.red('Falha ao iniciar o servidor Next.js:'), error);
      process.exit(1);
    }
  });

program.parse();
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Cache para evitar ler os arquivos repetidamente em cada requisição
let cachedConfig: { templatesPath: string } | null = null;

/**
 * Encontra e carrega a configuração do ses-pilot, procurando primeiro localmente e depois globalmente.
 * Retorna o caminho absoluto para a pasta de templates.
 * @throws {Error} Se nenhuma configuração for encontrada.
 */
export async function getTemplatesPath(): Promise<string> {
  if (cachedConfig) {
    return cachedConfig.templatesPath;
  }

  // Procura o arquivo de configuração em várias localizações possíveis
  const possibleConfigPaths = [
    // 1. No diretório atual (process.cwd())
    path.resolve(process.cwd(), 'ses-pilot.config.json'),
    // 2. No diretório pai (caso estejamos em src/web)
    path.resolve(process.cwd(), '..', 'ses-pilot.config.json'),
    // 3. No diretório pai do pai (caso estejamos em src/web/app)
    path.resolve(process.cwd(), '..', '..', 'ses-pilot.config.json'),
    // 4. No diretório pai do pai do pai (caso estejamos em src/web/app/api)
    path.resolve(process.cwd(), '..', '..', '..', 'ses-pilot.config.json'),
    // 5. No diretório global
    path.join(os.homedir(), '.ses-pilot', 'config.json')
  ];

  let config;
  let configSourcePath: string | null = null;

  for (const configPath of possibleConfigPaths) {
    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath);
      configSourcePath = path.dirname(configPath);
      break;
    }
  }

  if (!config || !configSourcePath) {
    throw new Error('Nenhum arquivo de configuração do ses-pilot foi encontrado. Rode `ses-pilot init`.');
  }

  // Resolve o caminho do template para um caminho absoluto.
  // Isso é importante porque o caminho no JSON pode ser relativo (ex: "./ses-templates").
  const absoluteTemplatesPath = path.resolve(configSourcePath, config.templatesPath);
  
  cachedConfig = { templatesPath: absoluteTemplatesPath };

  return absoluteTemplatesPath;
}
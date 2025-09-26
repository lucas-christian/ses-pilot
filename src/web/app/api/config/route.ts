import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Tentar diferentes caminhos para o arquivo de configuração (mesma lógica do CLI)
function getConfigPath() {
  const possiblePaths = [
    // 1. No diretório atual (process.cwd())
    join(process.cwd(), 'ses-pilot.config.json'),
    // 2. No diretório pai (caso estejamos em src/web)
    join(process.cwd(), '..', 'ses-pilot.config.json'),
    // 3. No diretório pai do pai (caso estejamos em src/web/app)
    join(process.cwd(), '..', '..', 'ses-pilot.config.json'),
    // 4. No diretório pai do pai do pai (caso estejamos em src/web/app/api)
    join(process.cwd(), '..', '..', '..', 'ses-pilot.config.json'),
    // 5. No diretório global
    join(homedir(), '.ses-pilot', 'config.json')
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  // Se não encontrar, usar o primeiro caminho como padrão
  return possiblePaths[0];
}

const CONFIG_PATH = getConfigPath();

export async function GET() {
  try {
    
    // Se o arquivo não existir, criar um padrão
    if (!existsSync(CONFIG_PATH)) {
      const defaultConfig = {
        mode: 'local',
        templatesPath: './ses-templates'
      };
      writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      return NextResponse.json(defaultConfig);
    }
    
    const configData = readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);
    
    // Resolver o caminho dos templates para absoluto (como o CLI faz)
    const configSourcePath = join(CONFIG_PATH, '..');
    const absoluteTemplatesPath = join(configSourcePath, config.templatesPath);
    config.templatesPath = absoluteTemplatesPath;
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao ler config:', error);
    return NextResponse.json(
      { error: `Failed to read config file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    
    // Ler configuração atual
    const currentConfigData = readFileSync(CONFIG_PATH, 'utf-8');
    const currentConfig = JSON.parse(currentConfigData);
    
    // Atualizar configuração
    const updatedConfig = { ...currentConfig, ...updates };
    
    // Se templatesPath foi atualizado, converter para relativo se necessário
    if (updates.templatesPath) {
      // const configSourcePath = join(CONFIG_PATH, '..');
      // const relativePath = join(configSourcePath, updates.templatesPath);
      updatedConfig.templatesPath = updates.templatesPath;
    }
    
    
    // Escrever arquivo atualizado
    writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
    
    // Retornar com caminho absoluto resolvido
    const configSourcePath = join(CONFIG_PATH, '..');
    const absoluteTemplatesPath = join(configSourcePath, updatedConfig.templatesPath);
    updatedConfig.templatesPath = absoluteTemplatesPath;
    
    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Erro ao atualizar config:', error);
    return NextResponse.json(
      { error: `Failed to update config file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

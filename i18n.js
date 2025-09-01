import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { osLocale } from 'os-locale';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '.language_config.json');

let translations = {};

/**
 * Carrega as preferências de idioma do arquivo de configuração interno do pacote.
 */
export async function loadLanguage() {
  let lang;

  if (fs.existsSync(CONFIG_PATH)) {
    const config = await fs.readJson(CONFIG_PATH);
    lang = config.language;
  } else {
    try {
      const locale = await osLocale();
      lang = locale && locale.startsWith('pt') ? 'pt' : 'en';
    } catch (error) {
      lang = 'en';
      console.warn("Could not detect OS locale, defaulting to English.");
    }
    await saveLanguage(lang);
  }

  const translationPath = path.join(__dirname, 'locales', `${lang}.json`);
  
  try {
    translations = await fs.readJson(translationPath);
  } catch(error) {
    console.error(chalk.red(`Error loading translation file: ${translationPath}`));
    console.error(chalk.red('Please ensure the locales folder and its JSON files are correctly placed in the package directory.'));
    process.exit(1);
  }
}

/**
 * Salva a preferência de idioma no arquivo de configuração DENTRO do diretório do pacote.
 * @param {string} lang - O idioma a ser salvo ('en' ou 'pt').
 */
export async function saveLanguage(lang) {
  await fs.writeJson(CONFIG_PATH, { language: lang });
}

/**
 * Obtém uma string traduzida pela sua chave.
 * @param {string} key - A chave da tradução.
 * @param {object} replacements - Substituições de placeholders.
 * @returns {string} A string traduzida.
 */
export function t(key, replacements = {}) {
  let str = translations[key] || key;
  for (const placeholder in replacements) {
    str = str.replace(
      new RegExp(`{{${placeholder}}}`, 'g'),
      replacements[placeholder]
    );
  }
  return str;
}
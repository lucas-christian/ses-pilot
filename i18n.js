import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { osLocale } from 'os-locale'; // <-- IMPORTAÇÃO

const CONFIG_PATH = '.language_config.json';
let translations = {};

/**
 * Carrega as preferências de idioma.
 * A lógica é:
 * 1. Tenta ler a configuração salva.
 * 2. Se não houver, detecta o idioma do sistema.
 * 3. Salva a detecção para as próximas execuções.
 */
export async function loadLanguage() {
  let lang;

  if (fs.existsSync(CONFIG_PATH)) {
    const config = await fs.readJson(CONFIG_PATH);
    lang = config.language;
  } else {
    try {
      const locale = await osLocale(); // Tenta detectar o idioma do OS
      // Se o locale começar com 'pt', usamos português. Caso contrário, inglês.
      lang = locale && locale.startsWith('pt') ? 'pt' : 'en';
    } catch (error) {
      // Em caso de falha na detecção, o padrão é inglês.
      lang = 'en';
      console.warn("Could not detect OS locale, defaulting to English.");
    }
    // Salva a configuração para não precisar detectar novamente
    await saveLanguage(lang);
  }

  const translationPath = path.join('locales', `${lang}.json`);
  translations = await fs.readJson(translationPath);
}

/**
 * Salva a preferência de idioma no arquivo de configuração.
 * @param {string} lang - O idioma a ser salvo ('en' ou 'pt').
 */
export async function saveLanguage(lang) {
  await fs.writeJson(CONFIG_PATH, { language: lang });
}

/**
 * Obtém uma string traduzida pela sua chave.
 * @param {string} key - A chave da tradução (ex: "welcome_title").
 * @param {object} replacements - Um objeto com valores para substituir placeholders (ex: { templateName: 'valor' }).
 * @returns {string} A string traduzida.
 */
export function t(key, replacements = {}) {
  // ... (Esta função não precisa de alterações)
  let str = translations[key] || key;
  for (const placeholder in replacements) {
    str = str.replace(
      new RegExp(`{{${placeholder}}}`, 'g'),
      replacements[placeholder]
    );
  }
  return str;
}
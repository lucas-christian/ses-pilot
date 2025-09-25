import { minify } from 'html-minifier-terser';

// Função para normalizar caracteres especiais para entidades HTML
function normalizeSpecialCharacters(text: string): string {
  const result: string[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // Se o caractere é maior que 127 (ASCII estendido), converte para entidade HTML
    if (code > 127) {
      result.push(`&#${code};`);
    } else {
      result.push(char);
    }
  }
  
  return result.join('');
}

// Função para converter entidades HTML de volta para UTF-8 (para exibição)
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  // Converte entidades numéricas &#DDD; de volta para caracteres UTF-8
  return text.replace(/&#(\d+);/g, (match, code) => {
    const charCode = parseInt(code, 10);
    return String.fromCharCode(charCode);
  });
}

// Função para minificar HTML
export async function minifyHtml(htmlContent: string): Promise<string> {
  try {
    // Primeiro normaliza caracteres especiais
    const normalizedHtml = normalizeSpecialCharacters(htmlContent);
    
    // Depois minifica
    return await minify(normalizedHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyURLs: true
    });
  } catch (error) {
    console.error('Erro ao minificar HTML:', error);
    return htmlContent;
  }
}

// Função para normalizar texto (assunto, e-mail, etc.)
export function normalizeText(text: string): string {
  if (!text) return '';
  
  // Primeiro normaliza caracteres especiais
  const normalized = normalizeSpecialCharacters(text);
  
  // Depois normaliza espaços
  return normalized.trim().replace(/\s+/g, ' ');
}

// Função para normalizar o texto antes do e-mail de origem
export function normalizeFromEmailAddress(fromEmail: string): string {
  if (!fromEmail) return 'noreply@example.com';
  
  const trimmed = fromEmail.trim();
  
  if (trimmed.includes('<') && trimmed.includes('>')) {
    const [text, email] = trimmed.split('<');
    const cleanEmail = email.replace('>', '');
    const normalizedText = normalizeText(text);
    
    return normalizedText ? `${normalizedText} <${cleanEmail}>` : cleanEmail;
  }
  
  return trimmed;
}

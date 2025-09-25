import { minify } from 'html-minifier-terser';
import { html } from 'js-beautify';

// Função para normalizar caracteres especiais para Unicode escape (\u00e7)
function normalizeToUnicodeEscape(text: string): string {
  const result: string[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // Se o caractere é maior que 127 (ASCII estendido), converte para Unicode escape
    if (code > 127) {
      result.push(`\\u${code.toString(16).padStart(4, '0')}`);
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
  let decoded = text.replace(/&#(\d+);/g, (match, code) => {
    const charCode = parseInt(code, 10);
    return String.fromCharCode(charCode);
  });
  
  // Converte Unicode escapes \uXXXX de volta para caracteres UTF-8
  decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    const charCode = parseInt(hex, 16);
    return String.fromCharCode(charCode);
  });
  
  return decoded;
}

// Função para formatar HTML de forma bonita (como Ctrl+Shift+F do VSCode)
export function formatHtml(htmlContent: string): string {
  if (!htmlContent) return '';
  
  try {
    return html(htmlContent, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 1,
      preserve_newlines: true,
      indent_scripts: 'normal',
      end_with_newline: false,
      wrap_line_length: 0,
      indent_inner_html: true,
      indent_empty_lines: false,
      wrap_attributes: 'auto',
      extra_liners: ['head', 'body', '/html'],
      inline: ['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em', 'b', 'i', 'u'],
      void_elements: ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']
    });
  } catch (error) {
    console.error('Erro ao formatar HTML:', error);
    return htmlContent;
  }
}

// Função para minificar HTML
export async function minifyHtml(htmlContent: string): Promise<string> {
  try {
    // Primeiro normaliza caracteres especiais para Unicode escape
    const normalizedHtml = normalizeToUnicodeEscape(htmlContent);
    
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

// Função para normalizar texto (assunto, e-mail, etc.) para Unicode escape
export function normalizeText(text: string): string {
  if (!text) return '';
  
  // Primeiro normaliza caracteres especiais para Unicode escape
  const normalized = normalizeToUnicodeEscape(text);
  
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

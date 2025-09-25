declare module 'html-minifier-terser' {
  export interface MinifyOptions {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
    minifyCSS?: boolean;
    minifyJS?: boolean;
    removeEmptyAttributes?: boolean;
    removeRedundantAttributes?: boolean;
    removeScriptTypeAttributes?: boolean;
    removeStyleLinkTypeAttributes?: boolean;
    useShortDoctype?: boolean;
    minifyURLs?: boolean;
  }

  export function minify(html: string, options?: MinifyOptions): Promise<string>;
}

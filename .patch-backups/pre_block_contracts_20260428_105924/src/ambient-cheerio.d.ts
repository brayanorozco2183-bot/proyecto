declare module 'cheerio' {
  export type CheerioAPI = any;
  export function load(html: string, options?: any): any;
}
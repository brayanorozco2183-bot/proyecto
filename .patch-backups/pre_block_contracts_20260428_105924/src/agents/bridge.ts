import axios from 'axios';
import { BaseAgent, AgentResponse } from './base.js';

export interface WordPressPostData {
  title: string;
  content: string;
  status?: 'draft' | 'publish' | 'private' | string;
  type?: 'page' | 'post' | string;
  slug?: string;
  excerpt?: string;
  meta?: Record<string, any>;
}

export interface WPBridgeInput {
  site_url: string;
  auth_user: string;
  auth_pass: string;
  post_data: WordPressPostData;
  enabled?: boolean;
}

export interface WPBridgeOutput {
  skipped: boolean;
  reason?: string;
  id?: number;
  url?: string;
  status?: string;
  type?: string;
}

export class WPBridgeAgent extends BaseAgent {
  constructor() {
    super(
      'WP_Bridge_06',
      'Publishing Bridge',
      'Puente WordPress',
      'Publica páginas en WordPress mediante la REST API.'
    );
  }

  async execute(input: WPBridgeInput): Promise<AgentResponse<WPBridgeOutput>> {
    if (input?.enabled === false) {
      await this.logThought('Publicación en WordPress desactivada por configuración.');
      return {
        success: true,
        data: { skipped: true, reason: 'wordpress_disabled' },
        thoughts: 'La publicación en WordPress está desactivada; se omite el puente remoto.'
      };
    }

    const siteUrl = String(input?.site_url || '').trim().replace(/\/+$/, '');
    const user = String(input?.auth_user || '').trim();
    const pass = String(input?.auth_pass || '').trim();
    const post = input?.post_data;

    if (!siteUrl || !user || !pass || !post?.title || !post?.content) {
      return {
        success: false,
        error: 'Faltan credenciales o post_data obligatorios para WordPress.',
        thoughts: 'No se pudo publicar porque faltan datos mínimos del puente WordPress.'
      };
    }

    const endpointType = post.type === 'post' ? 'posts' : 'pages';
    const endpoint = `${siteUrl}/wp-json/wp/v2/${endpointType}`;
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');

    const payload: Record<string, any> = {
      title: post.title,
      content: post.content,
      status: post.status || 'publish',
      meta: post.meta || {}
    };

    if (post.slug) payload.slug = post.slug;
    if (post.excerpt) payload.excerpt = post.excerpt;

    try {
      await this.logThought(`Publicando contenido en WordPress: ${endpointType} -> ${siteUrl}`);
      const response = await axios.post(endpoint, payload, {
        timeout: 30000,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data || {};
      return {
        success: true,
        data: {
          skipped: false,
          id: data.id,
          url: data.link,
          status: data.status,
          type: data.type || endpointType.slice(0, -1)
        },
        thoughts: `Publicación completada en WordPress con ID ${data.id || 'desconocido'}.`
      };
    } catch (error: any) {
      await this.logThought(`Error de WordPress Bridge: ${error.message}`);
      return {
        success: false,
        error: error.message,
        thoughts: 'Falló la publicación en WordPress a través del puente remoto.'
      };
    }
  }
}

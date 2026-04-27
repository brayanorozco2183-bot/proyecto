import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { vault } from '../tools/vault.js';
import { installOriginalitySchema } from '../originality/schema.js';
import { installLearningSchema } from '../learning/schema.js';

/**
 * DBManager handles the local persistence layer.
 * This version also installs learning/originality extensions so the
 * pipeline can accumulate curated lessons, exemplars and reserved fingerprints.
 */
export class DBManager {
  private db?: Database;

  async init(): Promise<void> {
    this.db = await open({
      filename: vault.DATABASE_PATH,
      driver: sqlite3.Database
    });

    console.log(`[DB] Database connected at: ${vault.DATABASE_PATH}`);

    await this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 8000;
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        niche TEXT,
        city TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS city_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id TEXT,
        city TEXT,
        keywords TEXT,
        entities TEXT,
        content_draft TEXT,
        audit_score INTEGER,
        competitor_metrics TEXT,
        last_pulse_at DATETIME,
        status TEXT,
        quality_score INTEGER DEFAULT 0,
        FOREIGN KEY(mission_id) REFERENCES missions(id)
      );
    `);

    const safeAlter = async (sql: string) => {
      try {
        await this.db!.exec(sql);
      } catch {
        // ignore migrations already applied
      }
    };

    await safeAlter(`ALTER TABLE city_data ADD COLUMN competitor_metrics TEXT;`);
    await safeAlter(`ALTER TABLE city_data ADD COLUMN keyword_report TEXT;`);
    await safeAlter(`ALTER TABLE city_data ADD COLUMN nap_data TEXT;`);
    await safeAlter(`ALTER TABLE city_data ADD COLUMN published_url TEXT;`);
    await safeAlter(`ALTER TABLE city_data ADD COLUMN quality_score INTEGER DEFAULT 0;`);
    await safeAlter(`ALTER TABLE missions ADD COLUMN city TEXT;`);
    await safeAlter(`ALTER TABLE site_settings ADD COLUMN ftp_host TEXT;`);
    await safeAlter(`ALTER TABLE site_settings ADD COLUMN ftp_user TEXT;`);
    await safeAlter(`ALTER TABLE site_settings ADD COLUMN ftp_pass TEXT;`);
    await safeAlter(`ALTER TABLE site_settings ADD COLUMN ftp_port INTEGER DEFAULT 22;`);
    await safeAlter(`ALTER TABLE site_settings ADD COLUMN ftp_path TEXT;`);
    await safeAlter(`ALTER TABLE site_settings ADD COLUMN enable_wordpress INTEGER DEFAULT 0;`);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_data_id INTEGER,
        type TEXT,
        path TEXT,
        remote_url TEXT,
        FOREIGN KEY(city_data_id) REFERENCES city_data(id)
      );

      CREATE TABLE IF NOT EXISTS agent_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id TEXT,
        agent_name TEXT,
        thought TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(mission_id) REFERENCES missions(id)
      );

      CREATE TABLE IF NOT EXISTS site_design (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_url TEXT UNIQUE,
        css_base TEXT,
        primary_color TEXT,
        secondary_color TEXT,
        font_family TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_url TEXT,
        auth_user TEXT,
        auth_pass TEXT,
        site_type TEXT,
        ftp_host TEXT,
        ftp_user TEXT,
        ftp_pass TEXT,
        ftp_port INTEGER DEFAULT 22,
        ftp_path TEXT,
        enable_wordpress INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS agent_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT,
        category TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS serp_gap_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT,
        analysis_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT,
        entity TEXT,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS internal_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_page TEXT,
        target_page TEXT,
        anchor_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fingerprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_type TEXT,
        family TEXT,
        hero_treatment TEXT,
        section_cadence TEXT,
        surface_style TEXT,
        block_sequence TEXT,
        structural_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await installOriginalitySchema(this.db as any);
    await installLearningSchema(this.db as any);
    console.log('[DB] Professional schema initialized with originality + learning extensions.');
  }

  async getSiteDesign(siteUrl: string): Promise<any> {
    const db = await this.getDB();
    return db.get('SELECT * FROM site_design WHERE site_url = ?', [siteUrl]);
  }

  async updateSiteDesign(siteUrl: string, design: { css_base: string; primary_color: string; secondary_color: string; font_family: string }): Promise<void> {
    const db = await this.getDB();
    await db.run(`
      INSERT INTO site_design (site_url, css_base, primary_color, secondary_color, font_family)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(site_url) DO UPDATE SET
        css_base = excluded.css_base,
        primary_color = excluded.primary_color,
        secondary_color = excluded.secondary_color,
        font_family = excluded.font_family,
        last_updated = CURRENT_TIMESTAMP
    `, [siteUrl, design.css_base, design.primary_color, design.secondary_color, design.font_family]);
  }

  async getDB(): Promise<Database> {
    if (!this.db) await this.init();
    return this.db!;
  }
}

export const dbManager = new DBManager();

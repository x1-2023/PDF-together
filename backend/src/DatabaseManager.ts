import Database from 'better-sqlite3';
import { DrawOp, TextOp } from './types';
import path from 'path';

interface AnnotationRow {
  id: string;
  channel_id: string;
  pdf_id: string;
  page: number;
  type: 'draw' | 'text';
  data: string; // JSON string
  user_id: string;
  created_at: number;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string = './data/discord-pdf.db') {
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    // Create annotations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        pdf_id TEXT NOT NULL,
        page INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('draw', 'text')),
        data TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_channel_pdf ON annotations(channel_id, pdf_id);
      CREATE INDEX IF NOT EXISTS idx_channel_pdf_page ON annotations(channel_id, pdf_id, page);
    `);

    console.log('✅ Database initialized');
  }

  // Save a single annotation
  saveAnnotation(
    channelId: string,
    pdfId: string,
    annotation: DrawOp | TextOp
  ): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO annotations (id, channel_id, pdf_id, page, type, data, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      annotation.id,
      channelId,
      pdfId,
      annotation.page,
      annotation.type,
      JSON.stringify(annotation),
      annotation.userId,
      annotation.ts
    );
  }

  // Save multiple annotations in a transaction (faster)
  saveAnnotations(
    channelId: string,
    pdfId: string,
    annotations: (DrawOp | TextOp)[]
  ): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO annotations (id, channel_id, pdf_id, page, type, data, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: (DrawOp | TextOp)[]) => {
      for (const annotation of items) {
        insert.run(
          annotation.id,
          channelId,
          pdfId,
          annotation.page,
          annotation.type,
          JSON.stringify(annotation),
          annotation.userId,
          annotation.ts
        );
      }
    });

    insertMany(annotations);
  }

  // Load all annotations for a specific channel + PDF
  loadAnnotations(channelId: string, pdfId: string): {
    drawOps: DrawOp[];
    textOps: TextOp[];
  } {
    const rows = this.db
      .prepare<[string, string]>(`
        SELECT * FROM annotations
        WHERE channel_id = ? AND pdf_id = ?
        ORDER BY created_at ASC
      `)
      .all(channelId, pdfId) as AnnotationRow[];

    const drawOps: DrawOp[] = [];
    const textOps: TextOp[] = [];

    for (const row of rows) {
      const data = JSON.parse(row.data);
      if (row.type === 'draw') {
        drawOps.push(data as DrawOp);
      } else if (row.type === 'text') {
        textOps.push(data as TextOp);
      }
    }

    return { drawOps, textOps };
  }

  // Load annotations for a specific page (for optimization)
  loadAnnotationsForPage(channelId: string, pdfId: string, page: number): {
    drawOps: DrawOp[];
    textOps: TextOp[];
  } {
    const rows = this.db
      .prepare<[string, string, number]>(`
        SELECT * FROM annotations
        WHERE channel_id = ? AND pdf_id = ? AND page = ?
        ORDER BY created_at ASC
      `)
      .all(channelId, pdfId, page) as AnnotationRow[];

    const drawOps: DrawOp[] = [];
    const textOps: TextOp[] = [];

    for (const row of rows) {
      const data = JSON.parse(row.data);
      if (row.type === 'draw') {
        drawOps.push(data as DrawOp);
      } else if (row.type === 'text') {
        textOps.push(data as TextOp);
      }
    }

    return { drawOps, textOps };
  }

  // Delete a specific annotation
  deleteAnnotation(id: string): void {
    this.db.prepare('DELETE FROM annotations WHERE id = ?').run(id);
  }

  // Delete all annotations for a specific page
  deleteAnnotationsForPage(channelId: string, pdfId: string, page: number): void {
    this.db
      .prepare('DELETE FROM annotations WHERE channel_id = ? AND pdf_id = ? AND page = ?')
      .run(channelId, pdfId, page);
  }

  // Delete all annotations for a specific PDF (all channels)
  deleteAllAnnotationsForPdf(pdfId: string): void {
    this.db
      .prepare('DELETE FROM annotations WHERE pdf_id = ?')
      .run(pdfId);
  }

  // Delete all annotations for a specific PDF (specific channel)
  deleteAnnotationsForPdf(channelId: string, pdfId: string): void {
    this.db
      .prepare('DELETE FROM annotations WHERE channel_id = ? AND pdf_id = ?')
      .run(channelId, pdfId);
  }

  // Get count of annotations
  getAnnotationCount(channelId: string, pdfId: string): number {
    const result = this.db
      .prepare<[string, string]>('SELECT COUNT(*) as count FROM annotations WHERE channel_id = ? AND pdf_id = ?')
      .get(channelId, pdfId) as { count: number };
    return result.count;
  }

  // Get all PDFs for a channel (for history)
  getPdfsForChannel(channelId: string): Array<{ pdf_id: string; count: number; latest: number }> {
    const rows = this.db
      .prepare<[string]>(`
        SELECT
          pdf_id,
          COUNT(*) as count,
          MAX(created_at) as latest
        FROM annotations
        WHERE channel_id = ?
        GROUP BY pdf_id
        ORDER BY latest DESC
      `)
      .all(channelId) as Array<{ pdf_id: string; count: number; latest: number }>;

    return rows;
  }

  // Cleanup old annotations (for maintenance)
  cleanupOldAnnotations(daysOld: number = 30): number {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const result = this.db
      .prepare('DELETE FROM annotations WHERE created_at < ?')
      .run(cutoffTime);
    return result.changes;
  }

  // Close database connection
  close(): void {
    this.db.close();
  }

  // Get database stats
  getStats(): {
    totalAnnotations: number;
    totalChannels: number;
    totalPdfs: number;
    dbSizeBytes: number;
  } {
    const totalAnnotations = this.db
      .prepare('SELECT COUNT(*) as count FROM annotations')
      .get() as { count: number };

    const totalChannels = this.db
      .prepare('SELECT COUNT(DISTINCT channel_id) as count FROM annotations')
      .get() as { count: number };

    const totalPdfs = this.db
      .prepare('SELECT COUNT(DISTINCT pdf_id) as count FROM annotations')
      .get() as { count: number };

    // Get database file size
    const fs = require('fs');
    let dbSizeBytes = 0;
    try {
      const stats = fs.statSync(this.db.name);
      dbSizeBytes = stats.size;
    } catch (err) {
      console.error('Error getting DB size:', err);
    }

    return {
      totalAnnotations: totalAnnotations.count,
      totalChannels: totalChannels.count,
      totalPdfs: totalPdfs.count,
      dbSizeBytes,
    };
  }
}

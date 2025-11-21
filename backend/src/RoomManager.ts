import { RoomState, DrawOp, TextOp } from './types';
import { DatabaseManager } from './DatabaseManager';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private readonly MAX_ANNOTATIONS_PER_PAGE = 500; // Prevent memory leak
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  getRoom(channelId: string): RoomState {
    if (!this.rooms.has(channelId)) {
      this.rooms.set(channelId, {
        channelId,
        currentPdfId: null,
        currentPage: 1,
        drawOps: [],
        textOps: [],
      });
    }
    return this.rooms.get(channelId)!;
  }

  setPdf(channelId: string, pdfId: string): RoomState {
    const room = this.getRoom(channelId);

    // Save current annotations to database before switching PDF
    if (room.currentPdfId && (room.drawOps.length > 0 || room.textOps.length > 0)) {
      console.log(`💾 Saving ${room.drawOps.length + room.textOps.length} annotations for PDF ${room.currentPdfId}`);
      this.db.saveAnnotations(channelId, room.currentPdfId, [...room.drawOps, ...room.textOps]);
    }

    // Load annotations from database for new PDF
    const { drawOps, textOps } = this.db.loadAnnotations(channelId, pdfId);
    console.log(`📂 Loaded ${drawOps.length + textOps.length} annotations for PDF ${pdfId}`);

    room.currentPdfId = pdfId;
    room.currentPage = 1;
    room.drawOps = drawOps;
    room.textOps = textOps;
    return room;
  }

  changePage(channelId: string, page: number): RoomState {
    const room = this.getRoom(channelId);
    room.currentPage = page;
    return room;
  }

  addDrawOp(channelId: string, drawOp: DrawOp): RoomState {
    const room = this.getRoom(channelId);
    room.drawOps.push(drawOp);

    // Save to database immediately
    if (room.currentPdfId) {
      this.db.saveAnnotation(channelId, room.currentPdfId, drawOp);
    }

    this.cleanupAnnotationsIfNeeded(room);
    return room;
  }

  addTextOp(channelId: string, textOp: TextOp): RoomState {
    const room = this.getRoom(channelId);

    // Check if this is an update to an existing op
    const existingIndex = room.textOps.findIndex(op => op.id === textOp.id);
    if (existingIndex !== -1) {
      room.textOps[existingIndex] = textOp;
    } else {
      room.textOps.push(textOp);
    }

    // Save to database immediately (handles upsert)
    if (room.currentPdfId) {
      this.db.saveAnnotation(channelId, room.currentPdfId, textOp);
    }

    this.cleanupAnnotationsIfNeeded(room);
    return room;
  }

  clearPage(channelId: string, page: number): RoomState {
    const room = this.getRoom(channelId);

    // Delete from database
    if (room.currentPdfId) {
      this.db.deleteAnnotationsForPage(channelId, room.currentPdfId, page);
    }

    // Remove from memory
    room.drawOps = room.drawOps.filter(op => op.page !== page);
    room.textOps = room.textOps.filter(op => op.page !== page);
    return room;
  }

  deleteAnnotation(channelId: string, id: string): RoomState {
    const room = this.getRoom(channelId);

    // Delete from database
    this.db.deleteAnnotation(id);

    // Remove from memory
    room.drawOps = room.drawOps.filter(op => op.id !== id);
    room.textOps = room.textOps.filter(op => op.id !== id);
    return room;
  }

  // Memory leak prevention: cleanup old annotations in memory only
  // Database keeps everything
  private cleanupAnnotationsIfNeeded(room: RoomState): void {
    const totalAnnotations = room.drawOps.length + room.textOps.length;

    if (totalAnnotations > this.MAX_ANNOTATIONS_PER_PAGE * 10) {
      console.warn(`⚠️  Room ${room.channelId} has too many annotations in memory (${totalAnnotations}), cleaning up`);

      // Keep only recent annotations in memory (sorted by timestamp)
      const allOps = [
        ...room.drawOps.map(op => ({ ...op, opType: 'draw' as const })),
        ...room.textOps.map(op => ({ ...op, opType: 'text' as const }))
      ].sort((a, b) => b.ts - a.ts);

      const keepCount = this.MAX_ANNOTATIONS_PER_PAGE * 5;
      const toKeep = allOps.slice(0, keepCount);

      room.drawOps = toKeep.filter(op => op.opType === 'draw').map(({ opType, ...rest }) => rest as DrawOp);
      room.textOps = toKeep.filter(op => op.opType === 'text').map(({ opType, ...rest }) => rest as TextOp);

      console.log(`✂️  Kept ${room.drawOps.length + room.textOps.length} recent annotations in memory`);
    }
  }

  getAllRooms(): Map<string, RoomState> {
    return this.rooms;
  }

  // Periodic save to database (called by server)
  saveAllRoomsToDatabase(): void {
    for (const [channelId, room] of this.rooms.entries()) {
      if (room.currentPdfId && (room.drawOps.length > 0 || room.textOps.length > 0)) {
        this.db.saveAnnotations(channelId, room.currentPdfId, [...room.drawOps, ...room.textOps]);
      }
    }
  }
}

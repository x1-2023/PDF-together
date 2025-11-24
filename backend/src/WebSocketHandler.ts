import { WebSocket, WebSocketServer } from 'ws';
import { parse } from 'url';
import { RoomManager } from './RoomManager';
import { WSMessage, DrawOp, TextOp, UserProfile } from './types';

interface ClientInfo {
  ws: WebSocket;
  channelId: string;
  userId: string;
  user: UserProfile;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private roomManager: RoomManager;

  constructor(wss: WebSocketServer, roomManager: RoomManager) {
    this.wss = wss;
    this.roomManager = roomManager;
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const query = parse(req.url || '', true).query;
      const channelId = query.channelId as string;
      const userId = query.userId as string;
      const username = query.username as string || 'Guest';
      const discriminator = query.discriminator as string || '0000';
      const avatar = query.avatar as string || null;

      if (!channelId || !userId) {
        ws.close(1008, 'Missing channelId or userId');
        return;
      }

      const userProfile: UserProfile = {
        id: userId,
        username,
        discriminator,
        avatar
      };

      console.log(`Client connected: ${username} (${userId}) in ${channelId}`);

      this.clients.set(ws, { ws, channelId, userId, user: userProfile });

      // Broadcast user joined
      this.broadcastToRoom(channelId, {
        type: 'user_joined',
        user: userProfile
      }, ws);

      // Send snapshot on connect
      const room = this.roomManager.getRoom(channelId);
      this.sendToClient(ws, {
        type: 'snapshot',
        data: room,
      });

      // Send list of existing users to the new client
      this.clients.forEach((client) => {
        if (client.channelId === channelId && client.userId !== userId) {
          this.sendToClient(ws, {
            type: 'user_joined',
            user: client.user
          });
        }
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${username} (${userId})`);
        this.clients.delete(ws);
        this.broadcastToRoom(channelId, {
          type: 'user_left',
          userId: userId
        });
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    const { channelId, userId } = clientInfo;

    switch (message.type) {
      case 'set_pdf':
        if (message.pdfId) {
          this.roomManager.setPdf(channelId, message.pdfId);
        }
        this.broadcastToRoom(channelId, {
          type: 'set_pdf',
          pdfId: message.pdfId,
        });
        break;

      case 'change_page':
        this.roomManager.changePage(channelId, message.page);
        this.broadcastToRoom(channelId, {
          type: 'change_page',
          page: message.page,
        });
        break;

      case 'draw':
        const drawOp: DrawOp = {
          id: message.id,
          type: 'draw',
          page: message.page,
          path: message.path,
          color: message.color,
          size: message.size,
          opacity: message.opacity || 1,
          userId: userId,
          ts: Date.now(),
        };
        this.roomManager.addDrawOp(channelId, drawOp);
        this.broadcastToRoom(channelId, {
          type: 'draw_broadcast',
          op: drawOp,
        });
        break;

      case 'text':
        const textOp: TextOp = {
          id: message.id,
          type: 'text',
          page: message.page,
          x: message.x,
          y: message.y,
          width: message.width,
          height: message.height,
          text: message.text,
          color: message.color,
          fontSize: message.fontSize,
          fontFamily: message.fontFamily,
          userId: userId,
          ts: Date.now(),
        };
        this.roomManager.addTextOp(channelId, textOp);
        this.broadcastToRoom(channelId, {
          type: 'text_broadcast',
          op: textOp,
        });
        break;

      case 'clear_page':
        this.roomManager.clearPage(channelId, message.page);
        this.broadcastToRoom(channelId, {
          type: 'clear_page_broadcast',
          page: message.page,
        });
        break;

      case 'delete_annotation':
        this.roomManager.deleteAnnotation(channelId, message.id);
        this.broadcastToRoom(channelId, {
          type: 'delete_annotation_broadcast',
          id: message.id,
        });
        break;

      case 'cursor':
        // Broadcast cursor position to all other clients in the room
        // We don't store cursors in DB as they are ephemeral
        this.broadcastToRoom(channelId, message, ws);
        break;

      case 'chat':
        // Broadcast chat message to all other clients
        this.broadcastToRoom(channelId, message, ws);
        break;
    }
  }

  private broadcastToRoom(channelId: string, message: any, excludeWs?: WebSocket) {
    this.clients.forEach((clientInfo) => {
      if (clientInfo.channelId === channelId && clientInfo.ws !== excludeWs) {
        this.sendToClient(clientInfo.ws, message);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

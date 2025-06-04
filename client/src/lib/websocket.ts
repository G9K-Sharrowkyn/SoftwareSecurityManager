import { GameState } from "@/lib/gameLogic";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface GameMessage extends WebSocketMessage {
  type: "game_state" | "game_action" | "chat_message" | "error";
  state?: GameState;
  message?: string;
  error?: string;
}

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn("No handler for message type:", message.type);
    }
  }

  public on(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  public off(messageType: string) {
    this.messageHandlers.delete(messageType);
  }

  public send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message:", message);
    }
  }

  public joinGame(gameId: string, userId: string) {
    this.send({
      type: "join_game",
      gameId,
      userId
    });
  }

  public sendGameAction(action: string, data?: any) {
    this.send({
      type: "game_action",
      action,
      actionData: data
    });
  }

  public sendChatMessage(message: string) {
    this.send({
      type: "chat_message",
      message
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Global WebSocket instance
let gameWebSocket: GameWebSocket | null = null;

export const getGameWebSocket = (): GameWebSocket => {
  if (!gameWebSocket) {
    gameWebSocket = new GameWebSocket();
  }
  return gameWebSocket;
};

export const disconnectGameWebSocket = () => {
  if (gameWebSocket) {
    gameWebSocket.disconnect();
    gameWebSocket = null;
  }
};

"use client";

import { useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

interface WSMessage {
  type: string;
  data: Record<string, unknown>;
}

export function useWebSocket(
  tenantId: string | undefined,
  onMessage: (msg: WSMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!tenantId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/${tenantId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WSMessage;
        onMessage(parsed);
      } catch {
        /* ignore malformed messages */
      }
    };

    ws.onclose = () => {
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [tenantId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}

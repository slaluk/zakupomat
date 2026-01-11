import { useEffect, useRef, useCallback } from 'react';

export function useSSE(onUpdate) {
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    const accessKey = localStorage.getItem('accessKey');
    if (!accessKey) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/sse`;
    const eventSource = new EventSource(url, {
      withCredentials: false,
    });

    // SSE doesn't support custom headers, so we need a workaround
    // We'll use a fetch request first to set up the connection
    eventSourceRef.current = null;

    fetch(url, {
      headers: {
        'X-Access-Key': accessKey,
        'Accept': 'text/event-stream',
      },
    }).then(response => {
      if (!response.ok) throw new Error('SSE connection failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (data && data !== '') {
                  try {
                    const parsed = JSON.parse(data);
                    onUpdate(parsed);
                  } catch {
                    // Ignore ping or invalid JSON
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('SSE stream error:', error);
          // Reconnect after delay
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      eventSourceRef.current = { close: () => reader.cancel() };
      processStream();
    }).catch(error => {
      console.error('SSE connection error:', error);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    });
  }, [onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { reconnect: connect };
}

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (room: string): void => {
  const s = getSocket();
  s.emit('join:room', room);
};

export const leaveRoom = (room: string): void => {
  const s = getSocket();
  s.emit('leave:room', room);
};

export const onEvent = (event: string, callback: (data: unknown) => void): (() => void) => {
  const s = getSocket();
  s.on(event, callback);
  return () => s.off(event, callback);
};

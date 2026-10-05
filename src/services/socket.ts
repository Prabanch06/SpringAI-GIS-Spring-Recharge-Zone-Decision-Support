import { io, Socket } from 'socket.io-client';
import { UserProfile, ActiveUserSession, BackgroundJob, FieldObservation, SpringEntity } from '../types';

let socket: Socket | null = null;

export const socketService = {
  connect(user?: UserProfile, currentTab: string = 'map', activeSpringId?: string): Socket {
    if (socket && socket.connected) {
      this.updateActivity(currentTab, activeSpringId);
      return socket;
    }

    // In dev and prod, connect to same-origin
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to SpringAI-GIS Real-Time Gateway (Socket ID:', socket?.id, ')');
      if (user) {
        socket?.emit('session:join', { user, currentTab, activeSpringId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected from Real-Time Gateway:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Real-Time Gateway connection error:', err.message);
    });

    return socket;
  },

  updateActivity(currentTab: string, activeSpringId?: string) {
    if (socket && socket.connected) {
      socket.emit('session:activity', { currentTab, activeSpringId });
    }
  },

  updateUser(user: UserProfile, currentTab: string = 'map') {
    if (socket && socket.connected) {
      socket.emit('session:join', { user, currentTab });
    }
  },

  onPresence(callback: (data: { onlineCount: number; users: ActiveUserSession[] }) => void) {
    if (!socket) return () => {};
    socket.on('presence:update', callback);
    return () => {
      socket?.off('presence:update', callback);
    };
  },

  onJobNew(callback: (job: BackgroundJob) => void) {
    if (!socket) return () => {};
    socket.on('job:new', callback);
    return () => {
      socket?.off('job:new', callback);
    };
  },

  onJobProgress(callback: (data: { jobId: string; status: string; progressPct: number; taskType: string }) => void) {
    if (!socket) return () => {};
    socket.on('job:progress', callback);
    return () => {
      socket?.off('job:progress', callback);
    };
  },

  onJobCompleted(callback: (data: { jobId: string; status: string; progressPct: number; result: any; taskType: string }) => void) {
    if (!socket) return () => {};
    socket.on('job:completed', callback);
    return () => {
      socket?.off('job:completed', callback);
    };
  },

  onValidationNew(callback: (obs: FieldObservation) => void) {
    if (!socket) return () => {};
    socket.on('validation:new', callback);
    return () => {
      socket?.off('validation:new', callback);
    };
  },

  onValidationUpdated(callback: (obs: FieldObservation) => void) {
    if (!socket) return () => {};
    socket.on('validation:updated', callback);
    return () => {
      socket?.off('validation:updated', callback);
    };
  },

  onSpringCreated(callback: (spring: SpringEntity) => void) {
    if (!socket) return () => {};
    socket.on('spring:created', callback);
    return () => {
      socket?.off('spring:created', callback);
    };
  },

  onDischargeLogged(callback: (data: { springId: string; record: any; updatedSpring?: SpringEntity }) => void) {
    if (!socket) return () => {};
    socket.on('spring:discharge_logged', callback);
    return () => {
      socket?.off('spring:discharge_logged', callback);
    };
  },

  onPriorityRecalculated(callback: (data: any) => void) {
    if (!socket) return () => {};
    socket.on('interventions:recalculated', callback);
    return () => {
      socket?.off('interventions:recalculated', callback);
    };
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  }
};

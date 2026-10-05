import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserProfile, ActiveUserSession } from '../types';
import { socketService } from '../services/socket';

export interface RealtimeNotification {
  id: string;
  type: 'job' | 'field' | 'spring' | 'system';
  title: string;
  message: string;
  timestamp: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  onlineCount: number;
  onlineUsers: ActiveUserSession[];
  notifications: RealtimeNotification[];
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  onlineCount: 1,
  onlineUsers: [],
  notifications: [],
  dismissNotification: () => {},
  clearNotifications: () => {},
});

export const RealtimeProvider: React.FC<{
  user: UserProfile;
  currentTab: string;
  activeSpringId?: string;
  children: React.ReactNode;
}> = ({ user, currentTab, activeSpringId, children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState<ActiveUserSession[]>([]);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  const addNotification = (notif: Omit<RealtimeNotification, 'id' | 'timestamp'>) => {
    const newNotif: RealtimeNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]); // keep last 20

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 6000);
  };

  useEffect(() => {
    const socket = socketService.connect(user, currentTab, activeSpringId);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    const unsubPresence = socketService.onPresence((data) => {
      setOnlineCount(data.onlineCount || 1);
      setOnlineUsers(data.users || []);
    });

    const unsubJob = socketService.onJobCompleted((job) => {
      addNotification({
        type: 'job',
        title: 'Geospatial Task Completed',
        message: `${job.taskType} (${job.jobId}) finished processing successfully.`,
      });
    });

    const unsubValidationNew = socketService.onValidationNew((obs) => {
      addNotification({
        type: 'field',
        title: 'New Field Observation',
        message: `${obs.observer} (${obs.role}) logged observation for ${obs.springName || 'Spring'}.`,
      });
    });

    const unsubValidationUpd = socketService.onValidationUpdated((obs) => {
      addNotification({
        type: 'field',
        title: 'Validation Reviewed',
        message: `Observation for ${obs.springName || 'Spring'} marked as ${obs.validationStatus}.`,
      });
    });

    const unsubSpring = socketService.onSpringCreated((spring) => {
      addNotification({
        type: 'spring',
        title: 'New Spring Registered',
        message: `${spring.name} (${spring.id}) added to state groundwater inventory.`,
      });
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      unsubPresence();
      unsubJob();
      unsubValidationNew();
      unsubValidationUpd();
      unsubSpring();
    };
  }, []);

  // Update presence activity on tab or active spring change
  useEffect(() => {
    socketService.updateActivity(currentTab, activeSpringId);
  }, [currentTab, activeSpringId]);

  // Update user session when role switches
  useEffect(() => {
    socketService.updateUser(user, currentTab);
  }, [user]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = useMemo(() => ({
    isConnected,
    onlineCount,
    onlineUsers,
    notifications,
    dismissNotification,
    clearNotifications,
  }), [isConnected, onlineCount, onlineUsers, notifications]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);

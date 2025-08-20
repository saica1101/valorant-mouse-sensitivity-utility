import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationData } from '../../../types';

interface NotificationState extends NotificationData {
  animationState: 'entering' | 'show' | 'exiting';
  progress: number;
  startTime: number;
}

interface NotificationContainerProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ 
  notifications, 
  onRemove 
}) => {
  const [notificationStates, setNotificationStates] = useState<NotificationState[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // プログレスバーの更新
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationStates(prev => 
        prev.map(state => {
          if (state.animationState === 'show') {
            const elapsed = Date.now() - state.startTime;
            const duration = state.duration || 5000;
            const progress = Math.max(0, Math.min(100, (elapsed / duration) * 100));
            
            // 自動削除のタイミング
            if (progress >= 100) {
              handleRemove(state.id);
            }
            
            return { ...state, progress };
          }
          return state;
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 削除処理を関数として分離
  const handleRemove = useCallback((id: string) => {
    // 既存のタイムアウトをクリア
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    // 削除アニメーション開始
    setNotificationStates(prev => 
      prev.map(state => 
        state.id === id && state.animationState !== 'exiting'
          ? { ...state, animationState: 'exiting' }
          : state
      )
    );

    // アニメーション完了後に完全削除
    const removeTimeout = setTimeout(() => {
      setNotificationStates(prev => prev.filter(state => state.id !== id));
      onRemove(id);
      timeoutsRef.current.delete(id);
    }, 300);

    timeoutsRef.current.set(id, removeTimeout);
  }, [onRemove]);

  // 新しい通知の追加処理
  useEffect(() => {
    const currentStateIds = new Set(notificationStates.map(state => state.id));
    const newNotifications = notifications.filter(notification => 
      !currentStateIds.has(notification.id)
    );

    if (newNotifications.length > 0) {
      // 新しい通知を追加
      const newStates = newNotifications.map(notification => ({
        ...notification,
        animationState: 'entering' as const,
        progress: 0,
        startTime: Date.now()
      }));

      setNotificationStates(prev => [...prev, ...newStates]);

      // show状態への遷移
      newNotifications.forEach(notification => {
        const showTimeout = setTimeout(() => {
          setNotificationStates(prev => 
            prev.map(state => 
              state.id === notification.id 
                ? { ...state, animationState: 'show' }
                : state
            )
          );
        }, 100);
        
        timeoutsRef.current.set(`show-${notification.id}`, showTimeout);
      });
    }
  }, [notifications]);

  // 削除された通知の処理
  useEffect(() => {
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    const statesToRemove = notificationStates.filter(state => 
      !currentNotificationIds.has(state.id) && state.animationState !== 'exiting'
    );

    statesToRemove.forEach(state => {
      handleRemove(state.id);
    });
  }, [notifications, notificationStates, handleRemove]);

  const handleNotificationClick = useCallback((id: string) => {
    handleRemove(id);
  }, [handleRemove]);

  // コンポーネントのアンマウント時にすべてのタイマーをクリア
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <div 
      id="notificationContainer" 
      className="notification-container" 
      role="alert" 
      aria-live="polite"
    >
      {notificationStates.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.type} ${notification.animationState}`}
          onClick={() => handleNotificationClick(notification.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNotificationClick(notification.id);
            }
          }}
          style={{
            // 削除アニメーション中の要素は他に影響を与えないように
            ...(notification.animationState === 'exiting' && {
              position: 'absolute',
              top: '0',
              right: '0',
              zIndex: 1
            })
          }}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'info' && 'ℹ️'}
              {notification.type === 'warning' && '⚠️'}
            </span>
            <span className="notification-text">{notification.message}</span>
          </div>
          {notification.animationState === 'show' && (
            <div 
              className="notification-progress"
              style={{ width: `${100 - notification.progress}%` }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;

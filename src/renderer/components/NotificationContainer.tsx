import React, { useState, useEffect } from 'react';
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

  // プログレスバーの更新
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationStates(prev => 
        prev.map(state => {
          if (state.animationState === 'show') {
            const elapsed = Date.now() - state.startTime;
            const duration = state.duration || 5000;
            const progress = Math.max(0, Math.min(100, (elapsed / duration) * 100));
            return { ...state, progress };
          }
          return state;
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 新しい通知が追加されたときの処理
  useEffect(() => {
    notifications.forEach(notification => {
      const existingState = notificationStates.find(state => state.id === notification.id);
      if (!existingState) {
        // 新しい通知を追加
        setNotificationStates(prev => [...prev, { 
          ...notification, 
          animationState: 'entering',
          progress: 0,
          startTime: Date.now()
        }]);
        
        // 少し遅延してからshow状態に変更
        setTimeout(() => {
          setNotificationStates(prev => 
            prev.map(state => 
              state.id === notification.id 
                ? { ...state, animationState: 'show' }
                : state
            )
          );
        }, 50);
      }
    });

    // 削除された通知の処理
    notificationStates.forEach(state => {
      const stillExists = notifications.find(notification => notification.id === state.id);
      if (!stillExists && state.animationState !== 'exiting') {
        // 通知を削除アニメーション状態に変更
        setNotificationStates(prev => 
          prev.map(prevState => 
            prevState.id === state.id 
              ? { ...prevState, animationState: 'exiting' }
              : prevState
          )
        );

        // アニメーション完了後に状態から削除
        setTimeout(() => {
          setNotificationStates(prev => 
            prev.filter(prevState => prevState.id !== state.id)
          );
        }, 300);
      }
    });
  }, [notifications, notificationStates]);

  const handleNotificationClick = (id: string) => {
    // クリック時は即座に削除アニメーションを開始
    setNotificationStates(prev => 
      prev.map(state => 
        state.id === id 
          ? { ...state, animationState: 'exiting' }
          : state
      )
    );

    // アニメーション完了後に親コンポーネントに削除を通知
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

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

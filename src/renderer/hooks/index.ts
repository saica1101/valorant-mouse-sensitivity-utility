import { useState, useEffect, useCallback } from 'react';
import { NotificationData } from '../../../types';
import { i18n } from '../../common/i18n';

// 言語管理のカスタムフック - シングルトンパターンでメモリリークを防止
let globalLanguageListenerCount = 0;
let globalLanguageState: 'ja' | 'en' = 'ja';
let globalLanguageListeners: Set<(lang: 'ja' | 'en') => void> = new Set();

const setupGlobalLanguageListener = () => {
  if (globalLanguageListenerCount === 0 && window.electronAPI && window.electronAPI.onLanguageChanged) {
    const globalHandler = (language: any) => {
      // language が文字列でない場合の処理
      let actualLanguage: 'ja' | 'en' = 'ja';
      if (typeof language === 'string') {
        actualLanguage = language as 'ja' | 'en';
      } else if (language && typeof language === 'object' && language.language) {
        actualLanguage = language.language as 'ja' | 'en';
      } else if (language && typeof language === 'object' && language.data) {
        actualLanguage = language.data as 'ja' | 'en';
      } else {
        console.error('🔍 [Renderer] Unknown language format:', language);
        return;
      }
      
      i18n.setLanguage(actualLanguage);
      globalLanguageState = actualLanguage;
      // すべての登録されたリスナーに通知
      globalLanguageListeners.forEach(listener => listener(actualLanguage));
    };
    window.electronAPI.onLanguageChanged(globalHandler);
  }
  globalLanguageListenerCount++;
};

const removeGlobalLanguageListener = () => {
  globalLanguageListenerCount--;
  if (globalLanguageListenerCount <= 0) {
    globalLanguageListenerCount = 0;
    // グローバルリスナーのクリーンアップは難しいので、カウンターだけ管理
  }
};

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'ja' | 'en'>('ja');

  useEffect(() => {
    console.log('🔍 [Renderer] useLanguage hook mounting');
    
    // ローカルリスナーを作成
    const localHandler = (language: 'ja' | 'en') => {
      setCurrentLanguage(language);
    };

    // グローバルリスナーに登録
    globalLanguageListeners.add(localHandler);
    setupGlobalLanguageListener();

    // 現在の言語状態を設定
    setCurrentLanguage(globalLanguageState);

    // 初期言語設定を読み込み（1回だけ）
    const loadInitialLanguage = async () => {
      if (window.electronAPI && window.electronAPI.loadSettings) {
        try {
          const settings = await window.electronAPI.loadSettings();
          const lang = (settings?.language || 'ja') as 'ja' | 'en';
          console.log('🔍 [Renderer] Initial language loaded:', lang);
          i18n.setLanguage(lang);
          globalLanguageState = lang;
          setCurrentLanguage(lang);
        } catch (error) {
          console.error('Failed to load initial language:', error);
          i18n.setLanguage('ja');
          globalLanguageState = 'ja';
          setCurrentLanguage('ja');
        }
      } else {
        console.log('🔍 [Renderer] ElectronAPI not available, using default language');
        i18n.setLanguage('ja');
        globalLanguageState = 'ja';
        setCurrentLanguage('ja');
      }
    };

    if (globalLanguageListenerCount === 1) {
      loadInitialLanguage();
    }

    // クリーンアップ
    return () => {
      console.log('🔍 [Renderer] useLanguage hook unmounting');
      globalLanguageListeners.delete(localHandler);
      removeGlobalLanguageListener();
    };
  }, []); // 空の依存配列で初回のみ実行

  // 翻訳関数
  const t = useCallback((key: string, defaultValue?: string) => {
    return i18n.t(key, defaultValue);
  }, [currentLanguage]);

  return {
    currentLanguage,
    t
  };
};

// 通知システムのカスタムフック
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [timeouts, setTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // 自動削除のタイマーを設定
    const timeout = setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);

    setTimeouts(prev => new Map(prev).set(id, timeout));
  }, []);

  const removeNotification = useCallback((id: string) => {
    // タイマーをクリア
    setTimeouts(prev => {
      const newTimeouts = new Map(prev);
      const timeout = newTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        newTimeouts.delete(id);
      }
      return newTimeouts;
    });

    // 通知を削除
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // コンポーネントのアンマウント時にすべてのタイマーをクリア
  useEffect(() => {
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [timeouts]);

  return { notifications, addNotification, removeNotification };
};

// テーマ管理のカスタムフック
export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  const toggleTheme = useCallback(() => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    
    if (newIsDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 初期化時にテーマを適用
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  return { isDarkMode, toggleTheme };
};

// ElectronAPIとの統合フック
export const useElectronAPI = () => {
  const [version, setVersion] = useState<string>('読み込み中...');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getVersion()
        .then((v: string) => setVersion(v))
        .catch(() => setVersion('v1.4.0'));
    } else {
      setVersion('v1.4.0');
    }
  }, []);

  const getScriptContent = useCallback(async (scriptName: string) => {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.getScriptContent(scriptName);
      } catch (error) {
        console.error('Failed to get script content:', error);
        return null;
      }
    }
    return null;
  }, []);

  const saveSettings = useCallback(async (settings: any) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveSettings(settings);
        return true;
      } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
      }
    }
    return false;
  }, []);

  const loadSettings = useCallback(async () => {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.loadSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        return {};
      }
    }
    return {};
  }, []);

  return {
    version,
    getScriptContent,
    saveSettings,
    loadSettings
  };
};

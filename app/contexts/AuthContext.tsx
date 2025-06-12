import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// Declare global event emitter type
declare global {
  var EventEmitter: EventEmitter;
}

// Add custom events
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS'
};

type AuthContextType = {
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查存储的登录状态
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(value === 'true');
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };

  const login = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      
      // 发出登录成功事件通知
      if (global.EventEmitter) {
        global.EventEmitter.emit(AUTH_EVENTS.LOGIN_SUCCESS);
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const logout = async () => {
    try {
      // 清除本地存储
      await AsyncStorage.setItem('isLoggedIn', 'false');
      await AsyncStorage.removeItem('email_for_signin');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
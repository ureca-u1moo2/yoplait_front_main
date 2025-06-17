// src/context/NotificationContext.js

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000); // 5초 후 자동 닫힘
  }, []);

  const closeNotification = () => setNotification(null);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Notification UI */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className={`rounded-2xl shadow-2xl p-4 border-l-4 backdrop-blur-sm transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-green-50/90 border-green-400 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50/90 border-red-400 text-red-800'
              : 'bg-blue-50/90 border-blue-400 text-blue-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : notification.type === 'error' ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div className="ml-3 flex-1 text-sm font-medium">
                {notification.message}
              </div>
              <button
                onClick={closeNotification}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

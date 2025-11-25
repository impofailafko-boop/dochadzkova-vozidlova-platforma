import { useState, useEffect, useCallback } from 'react';

export interface DebugLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
}

const STORAGE_KEY = 'attendance_debug_logs';
const MAX_LOGS = 50;

export function useDebugLog() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  // Load logs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLogs(parsed);
      } catch (e) {
        console.error('Failed to parse debug logs:', e);
      }
    }
  }, []);

  const addLog = useCallback((message: string, level: DebugLogEntry['level'] = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8); // HH:MM:SS
    const newLog: DebugLogEntry = { timestamp, message, level };
    
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportLogs = useCallback(() => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-debug-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  return { logs, addLog, clearLogs, exportLogs };
}

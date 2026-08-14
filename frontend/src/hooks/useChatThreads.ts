import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Message, Thread } from '../types';
import { useToast } from '../components/Toast';

export function useChatThreads() {
  const { showToast } = useToast();
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const saved = localStorage.getItem('chat_threads');
      return saved ? JSON.parse(saved) : [{ id: 'default', title: 'Main Chat Thread', updatedAt: Date.now(), messages: [] }];
    } catch {
      return [{ id: 'default', title: 'Main Chat Thread', updatedAt: Date.now(), messages: [] }];
    }
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('default');
  const [deleteModalThread, setDeleteModalThread] = useState<Thread | null>(null);

  // Derive active messages
  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  const messages = activeThread?.messages || [];

  // Persist threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chat_threads', JSON.stringify(threads));
    } catch {}
  }, [threads]);

  // Sorted threads (pinned threads first, then recent)
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [threads]);

  const updateCurrentThreadMessages = useCallback((newMsgs: Message[]) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const title =
            t.title.startsWith('Thread #') && newMsgs.length > 0
              ? newMsgs[0].text.substring(0, 24) + (newMsgs[0].text.length > 24 ? '...' : '')
              : t.title;
          return { ...t, title, messages: newMsgs, updatedAt: Date.now() };
        }
        return t;
      })
    );
  }, [activeThreadId]);

  const createNewThread = useCallback(() => {
    const newId = `thread_${Date.now()}`;
    const newThread: Thread = {
      id: newId,
      title: `Thread #${threads.length + 1}`,
      updatedAt: Date.now(),
      messages: [],
      isPinned: false,
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    showToast('New conversation thread created', 'info', 'New Chat Session');
  }, [threads.length, showToast]);

  const switchThread = useCallback((id: string) => {
    setActiveThreadId(id);
  }, []);

  const togglePinThread = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isPinned = !t.isPinned;
          showToast(isPinned ? 'Thread pinned to top' : 'Thread unpinned', 'info');
          return { ...t, isPinned };
        }
        return t;
      })
    );
  }, [showToast]);

  const requestDeleteThread = useCallback((thread: Thread, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalThread(thread);
  }, []);

  const confirmDeleteThread = useCallback(() => {
    if (!deleteModalThread) return;
    const id = deleteModalThread.id;
    if (threads.length <= 1) {
      setThreads([{ id: 'default', title: 'Main Chat Thread', updatedAt: Date.now(), messages: [], isPinned: false }]);
      setActiveThreadId('default');
      showToast('Reset main conversation thread', 'info');
    } else {
      const updated = threads.filter((t) => t.id !== id);
      setThreads(updated);
      if (activeThreadId === id) {
        setActiveThreadId(updated[0].id);
      }
      showToast('Thread deleted', 'info');
    }
    setDeleteModalThread(null);
  }, [deleteModalThread, threads, activeThreadId, showToast]);

  return {
    threads,
    sortedThreads,
    activeThreadId,
    messages,
    deleteModalThread,
    setDeleteModalThread,
    updateCurrentThreadMessages,
    createNewThread,
    switchThread,
    togglePinThread,
    requestDeleteThread,
    confirmDeleteThread,
  };
}

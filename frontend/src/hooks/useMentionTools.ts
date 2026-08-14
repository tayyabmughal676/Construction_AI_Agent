import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { AgentCapabilities, ToolItem } from '../types';

export function useMentionTools(capabilities: AgentCapabilities | null, input: string, setInput: (v: string) => void) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  // Build flat tool list from capabilities
  const allTools: ToolItem[] = useMemo(() => {
    if (!capabilities) return [];
    const tools: ToolItem[] = [];
    for (const dept of capabilities.registered_departments) {
      const cap = capabilities.capabilities[dept] || '';
      const lines = cap.split('\n').filter((l: string) => l.trim().startsWith('- '));
      for (const line of lines) {
        const match = line.match(/- ([^:]+): (.+)/);
        if (match) {
          tools.push({ name: match[1].trim(), desc: match[2].trim(), dept });
        }
      }
    }
    return tools;
  }, [capabilities]);

  // Filtered tools for @-mention dropdown
  const filteredTools = useMemo(() => {
    if (!mentionFilter) return allTools;
    const q = mentionFilter.toLowerCase();
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.dept.toLowerCase().includes(q)
    );
  }, [allTools, mentionFilter]);

  // Reset mention index when filtered count changes
  useEffect(() => {
    setMentionIndex(0);
  }, [filteredTools.length]);

  // Insert selected tool into input
  const insertMention = useCallback(
    (tool: ToolItem) => {
      const before = input.substring(0, mentionStartPos);
      const after = input.substring(inputRef.current?.selectionStart || input.length);
      const newInput = `${before}@${tool.name} ${after}`;
      setInput(newInput);
      setMentionOpen(false);
      setMentionFilter('');
      setMentionStartPos(-1);
      setTimeout(() => {
        if (inputRef.current) {
          const pos = before.length + tool.name.length + 2;
          inputRef.current.focus();
          inputRef.current.selectionStart = pos;
          inputRef.current.selectionEnd = pos;
        }
      }, 0);
    },
    [input, mentionStartPos, setInput]
  );

  // Handle textarea change and detect @
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInput(val);
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';

      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = val.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!/\s/.test(textAfterAt) || textAfterAt === '') {
          setMentionOpen(true);
          setMentionStartPos(lastAtIndex);
          setMentionFilter(textAfterAt);
          return;
        }
      }
      setMentionOpen(false);
    },
    [setInput]
  );

  return {
    mentionOpen,
    setMentionOpen,
    mentionFilter,
    mentionIndex,
    setMentionIndex,
    filteredTools,
    inputRef,
    mentionRef,
    insertMention,
    handleInputChange,
  };
}

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HR from './components/HR'
import Construction from './components/Construction'
import Manufacturing from './components/Manufacturing'
import Workflow from './components/Workflow'
import { useToast } from './components/Toast'

interface Detection {
  department?: string;
  confidence?: number;
  action?: string;
  parameters?: Record<string, any>;
  method?: string;
}

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  department?: string;
  toolsUsed?: string[];
  detection?: Detection;
  timestamp?: Date;
  data?: any;
}

type View = 'chat' | 'hr' | 'construction' | 'manufacturing' | 'workflow'

type AuthView = 'login' | 'signup'

interface AgentCapabilities {
  registered_departments: string[];
  capabilities: Record<string, string>;
}

const DEPT_ICONS_MAP: Record<string, string> = {
  construction: '🏗️',
  hr: '👥',
  manufacturing: '🏭',
}

const DEPT_LABELS: Record<string, string> = {
  construction: 'Construction',
  hr: 'HR',
  manufacturing: 'Manufacturing',
}

const DEPT_BORDER_COLOR: Record<string, string> = {
  construction: 'border-amber-500/30 hover:border-amber-500/50',
  hr: 'border-purple-500/30 hover:border-purple-500/50',
  manufacturing: 'border-blue-500/30 hover:border-blue-500/50',
}

const DEPT_BG: Record<string, string> = {
  construction: 'from-amber-500/10 to-transparent',
  hr: 'from-purple-500/10 to-transparent',
  manufacturing: 'from-blue-500/10 to-transparent',
}

const DEPT_TEXT: Record<string, string> = {
  construction: 'text-amber-400',
  hr: 'text-purple-400',
  manufacturing: 'text-blue-400',
}

const NAV_ITEMS: { key: View; label: string; icon: string; desc: string }[] = [
  { key: 'chat', label: 'Intelligence Terminal', icon: '⚡', desc: 'Multi-agent AI chat' },
  { key: 'hr', label: 'HR Hub', icon: '👥', desc: 'Workforce directory' },
  { key: 'construction', label: 'Site Terminal', icon: '🏗️', desc: 'Project management' },
  { key: 'manufacturing', label: 'Fabrication Node', icon: '🏭', desc: 'Inventory & production' },
  { key: 'workflow', label: 'Workflow Center', icon: '🔄', desc: 'LangGraph orchestration' },
]

const SUGGESTION_CHIPS = [
  { text: 'Show all projects', icon: '📋' },
  { text: 'Register a new employee', icon: '👤' },
  { text: 'Check inventory levels', icon: '📦' },
  { text: 'Generate safety checklist', icon: '🛡️' },
  { text: 'Request leave for EMP001', icon: '🏖️' },
  { text: 'Calculate material costs for steel', icon: '💰' },
]

const DEPT_COLOR_MAP: Record<string, string> = {
  HR: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  CONSTRUCTION: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  MANUFACTURING: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  SYSTEM: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
}

const DEPT_ACCENT: Record<string, string> = {
  HR: 'text-purple-400',
  CONSTRUCTION: 'text-amber-400',
  MANUFACTURING: 'text-blue-400',
  SYSTEM: 'text-emerald-400',
}

interface ToolItem {
  name: string;
  desc: string;
  dept: string;
}

interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

function App() {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<View>('chat')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' })
  const [authView, setAuthView] = useState<AuthView>('login')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [capabilities, setCapabilities] = useState<AgentCapabilities | null>(null)
  // @-mention state
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState(-1)
  // Voice & Multi-thread state
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const saved = localStorage.getItem('chat_threads')
      return saved ? JSON.parse(saved) : [{ id: 'default', title: 'Main Chat Thread', updatedAt: Date.now(), messages: [] }]
    } catch {
      return [{ id: 'default', title: 'Main Chat Thread', updatedAt: Date.now(), messages: [] }]
    }
  })
  const [activeThreadId, setActiveThreadId] = useState<string>('default')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mentionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      setIsLoggedIn(true)
    }
  }, [])

  // Fetch capabilities when logged in
  useEffect(() => {
    if (!token) return
    fetch('/api/agents/capabilities', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCapabilities(data))
      .catch(() => {})
  }, [token])

  // Persist threads to localStorage and sync messages
  useEffect(() => {
    try {
      localStorage.setItem('chat_threads', JSON.stringify(threads))
    } catch {}
  }, [threads])

  // Sync active thread with messages
  const updateCurrentThreadMessages = useCallback((newMsgs: Message[]) => {
    setMessages(newMsgs)
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        const title = t.title.startsWith('Thread #') && newMsgs.length > 0
          ? newMsgs[0].text.substring(0, 24) + (newMsgs[0].text.length > 24 ? '...' : '')
          : t.title
        return { ...t, title, messages: newMsgs, updatedAt: Date.now() }
      }
      return t
    }))
  }, [activeThreadId])

  const createNewThread = () => {
    const newId = `thread_${Date.now()}`
    const newThread: Thread = {
      id: newId,
      title: `Thread #${threads.length + 1}`,
      updatedAt: Date.now(),
      messages: [],
    }
    setThreads(prev => [newThread, ...prev])
    setActiveThreadId(newId)
    setMessages([])
    showToast('New conversation thread created', 'info', 'New Chat Session')
  }

  const switchThread = (id: string) => {
    setActiveThreadId(id)
    const target = threads.find(t => t.id === id)
    setMessages(target ? target.messages : [])
  }

  const deleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (threads.length <= 1) {
      setMessages([])
      setThreads([{ id: 'default', title: 'Main Chat Thread', updatedAt: Date.now(), messages: [] }])
      setActiveThreadId('default')
      showToast('Reset main conversation thread', 'info')
      return
    }
    const updated = threads.filter(t => t.id !== id)
    setThreads(updated)
    if (activeThreadId === id) {
      setActiveThreadId(updated[0].id)
      setMessages(updated[0].messages)
    }
    showToast('Thread deleted', 'info')
  }

  // Voice-to-Text Speech Recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast('Speech Recognition is not supported in this browser.', 'warning')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      showToast('Voice recording stopped', 'info')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      showToast('Listening... Speak now', 'info', 'Voice Input Active')
    }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
      setIsListening(false)
      showToast('Transcribed voice speech to text', 'success')
    }
    recognition.onerror = () => {
      setIsListening(false)
      showToast('Voice recognition error.', 'error')
    }
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  // Build flat tool list from capabilities
  const allTools: ToolItem[] = useMemo(() => {
    if (!capabilities) return []
    const tools: ToolItem[] = []
    for (const dept of capabilities.registered_departments) {
      const cap = capabilities.capabilities[dept] || ''
      const lines = cap.split('\n').filter((l: string) => l.trim().startsWith('- '))
      for (const line of lines) {
        const match = line.match(/- ([^:]+): (.+)/)
        if (match) {
          tools.push({ name: match[1].trim(), desc: match[2].trim(), dept })
        }
      }
    }
    return tools
  }, [capabilities])

  // Filtered tools for @-mention dropdown
  const filteredTools = useMemo(() => {
    if (!mentionFilter) return allTools
    const q = mentionFilter.toLowerCase()
    return allTools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.dept.toLowerCase().includes(q)
    )
  }, [allTools, mentionFilter])

  // Reset mention index when filter changes
  useEffect(() => {
    setMentionIndex(0)
  }, [filteredTools.length])

  // Insert selected tool into input
  const insertMention = useCallback((tool: ToolItem) => {
    const before = input.substring(0, mentionStartPos)
    const after = input.substring(inputRef.current?.selectionStart || input.length)
    const newInput = `${before}@${tool.name} ${after}`
    setInput(newInput)
    setMentionOpen(false)
    setMentionFilter('')
    setMentionStartPos(-1)
    // Focus and set cursor after tool name
    setTimeout(() => {
      if (inputRef.current) {
        const pos = before.length + tool.name.length + 2 // @ + name + space
        inputRef.current.focus()
        inputRef.current.selectionStart = pos
        inputRef.current.selectionEnd = pos
      }
    }, 0)
  }, [input, mentionStartPos])

  // Auto-resize textarea + detect @-mention
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'

    // Detect @ mention
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = val.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      // Check there's no space between @ and cursor (or it's just @)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      if (!/\s/.test(textAfterAt) || textAfterAt === '') {
        setMentionOpen(true)
        setMentionStartPos(lastAtIndex)
        setMentionFilter(textAfterAt)
        return
      }
    }
    setMentionOpen(false)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const endpoint = authView === 'login' ? '/auth/login' : '/auth/register'
      const formData = authView === 'login' ? loginForm : signupForm
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data: any = await response.json()
      if (response.ok) {
        setToken(data.token)
        localStorage.setItem('token', data.token)
        setIsLoggedIn(true)
        setLoginForm({ email: '', password: '' })
        setSignupForm({ name: '', email: '', password: '' })
      } else {
        alert(data.error || 'Auth failed')
      }
    } catch {
      alert('Auth error')
    }
  }

  const logout = () => {
    setToken(null)
    setIsLoggedIn(false)
    localStorage.removeItem('token')
    setMessages([])
  }

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText || input.trim()
    if (!text) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      from: 'user',
      timestamp: new Date(),
    }
    const updatedMsgs = [...messages, userMessage]
    updateCurrentThreadMessages(updatedMsgs)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setIsLoading(true)

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ message: text }),
      })
      const data: any = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        from: 'bot',
        department: data.department,
        toolsUsed: data.toolsUsed,
        detection: data.detection,
        timestamp: new Date(),
        data: data.data,
      }
      updateCurrentThreadMessages([...updatedMsgs, botMessage])
    } catch {
      updateCurrentThreadMessages([...updatedMsgs, {
        id: (Date.now() + 1).toString(),
        text: 'Error communicating with AI agent.',
        from: 'bot',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle @-mention keyboard navigation
    if (mentionOpen && filteredTools.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(prev => (prev + 1) % filteredTools.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredTools[mentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionOpen(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Auth Screen ───
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-construction-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-construction-gold/10 border border-construction-gold/20 mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Construction AI</h1>
            <p className="text-sm text-slate-400 mt-1">Multi-Agent Intelligence Platform</p>
          </div>

          <div className="flex mb-6 bg-slate-900/50 rounded-lg p-1">
            <button
              onClick={() => setAuthView('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authView === 'login'
                  ? 'bg-construction-gold text-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authView === 'signup'
                  ? 'bg-construction-gold text-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authView === 'signup' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-construction-gold/50 focus:ring-2 focus:ring-construction-gold/20 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                value={authView === 'login' ? loginForm.email : signupForm.email}
                onChange={(e) =>
                  authView === 'login'
                    ? setLoginForm(prev => ({ ...prev, email: e.target.value }))
                    : setSignupForm(prev => ({ ...prev, email: e.target.value }))
                }
                className="w-full p-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-construction-gold/50 focus:ring-2 focus:ring-construction-gold/20 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <input
                type="password"
                value={authView === 'login' ? loginForm.password : signupForm.password}
                onChange={(e) =>
                  authView === 'login'
                    ? setLoginForm(prev => ({ ...prev, password: e.target.value }))
                    : setSignupForm(prev => ({ ...prev, password: e.target.value }))
                }
                className="w-full p-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-construction-gold/50 focus:ring-2 focus:ring-construction-gold/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-construction-gold text-black font-semibold rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-construction-gold/20 hover:shadow-construction-gold/30"
            >
              {authView === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // ─── Main Application ───
  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full bg-slate-950/80 border-r border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-construction-gold/15 border border-construction-gold/25 flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-white truncate">Construction AI</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Multi-Agent Platform</p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                {NAV_ITEMS.map(({ key, label, icon, desc }) => (
                  <button
                    key={key}
                    onClick={() => setCurrentView(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                      currentView === key
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/50'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <span className={`text-lg transition-transform ${currentView === key ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{desc}</div>
                    </div>
                    {currentView === key && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-construction-gold" />
                    )}
                  </button>
                ))}
              </div>

              {/* Chat Threads Section */}
              {currentView === 'chat' && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Conversations</span>
                    <button
                      onClick={createNewThread}
                      className="p-1 rounded-md text-slate-400 hover:text-construction-gold hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
                      title="New Conversation"
                    >
                      <span className="font-bold">+</span> New
                    </button>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {threads.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => switchThread(t.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                          activeThreadId === t.id
                            ? 'bg-construction-gold/15 text-white font-medium border border-construction-gold/20'
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate flex-1 pr-2">{t.title}</span>
                        <button
                          onClick={(e) => deleteThread(t.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-500 hover:text-red-400 p-0.5 rounded transition-opacity"
                          title="Delete thread"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Sidebar footer */}
            <div className="p-3 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <header className="h-14 flex items-center px-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all mr-3"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{NAV_ITEMS.find(n => n.key === currentView)?.icon}</span>
            <h2 className="text-sm font-semibold text-white">{NAV_ITEMS.find(n => n.key === currentView)?.label}</h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">Live</span>
            </div>
          </div>
        </header>

        {/* View content */}
        {currentView === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                /* Welcome screen */
                <div className="h-full flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl w-full"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-construction-gold/20 to-amber-600/5 border border-construction-gold/20 mb-4">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Unified Intelligence Terminal</h2>
                    <p className="text-slate-400 mb-6 text-sm">
                      Your queries are intelligently routed to the right department.
                    </p>

                    {/* Agent Capability Cards */}
                    {capabilities && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left">
                        {capabilities.registered_departments.map((dept) => {
                          const cap = capabilities.capabilities[dept] || '';
                          // Parse tools from capability text
                          const toolLines = cap.split('\n').filter((l: string) => l.trim().startsWith('- '));
                          const tools = toolLines.map((l: string) => {
                            const match = l.match(/- ([^:]+): (.+)/);
                            return match ? { name: match[1].trim(), desc: match[2].trim() } : null;
                          }).filter(Boolean).slice(0, 5);

                          return (
                            <motion.div
                              key={dept}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: capabilities.registered_departments.indexOf(dept) * 0.1 }}
                              className={`bg-gradient-to-b ${DEPT_BG[dept] || 'from-slate-800/50 to-transparent'} border ${DEPT_BORDER_COLOR[dept] || 'border-slate-700/50'} rounded-xl p-4 transition-all`}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">{DEPT_ICONS_MAP[dept] || '🤖'}</span>
                                <span className={`text-sm font-bold ${DEPT_TEXT[dept] || 'text-white'}`}>
                                  {DEPT_LABELS[dept] || dept}
                                </span>
                                <span className="ml-auto text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">{tools.length} tools</span>
                              </div>
                              <div className="space-y-1.5">
                                {tools.map((tool: any) => (
                                  <div key={tool.name} className="flex items-start gap-1.5">
                                    <span className="text-[10px] text-slate-600 mt-0.5">⚙</span>
                                    <div className="min-w-0">
                                      <span className="text-[11px] text-slate-300 font-mono">{tool.name}</span>
                                      <p className="text-[10px] text-slate-500 leading-tight truncate">{tool.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Action Chips */}
                    <div className="mb-2">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-2">Quick Actions</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-xl mx-auto">
                        {SUGGESTION_CHIPS.map((chip) => (
                          <button
                            key={chip.text}
                            onClick={() => sendMessage(chip.text)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 rounded-xl text-left transition-all group"
                          >
                            <span className="text-sm">{chip.icon}</span>
                            <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-tight">{chip.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                /* Messages */
                <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {msg.from === 'user' ? (
                        /* User message */
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-xl bg-construction-gold/20 border border-construction-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-construction-gold">You</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">You</span>
                              {msg.timestamp && (
                                <span className="text-[10px] text-slate-600">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{msg.text}</p>
                          </div>
                        </div>
                      ) : (
                        /* Bot message */
                        <div className={`flex gap-3 items-start rounded-2xl p-4 bg-gradient-to-r ${DEPT_COLOR_MAP[msg.department?.toUpperCase() || ''] || 'from-slate-800/50 to-slate-800/20 border-slate-700/50'} border`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            msg.department?.toUpperCase() === 'HR' ? 'bg-purple-500/20 border border-purple-500/30' :
                            msg.department?.toUpperCase() === 'CONSTRUCTION' ? 'bg-amber-500/20 border border-amber-500/30' :
                            msg.department?.toUpperCase() === 'MANUFACTURING' ? 'bg-blue-500/20 border border-blue-500/30' :
                            msg.department?.toUpperCase() === 'SYSTEM' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                            'bg-slate-700 border border-slate-600'
                          }`}>
                            <span className="text-sm">
                              {msg.department?.toUpperCase() === 'HR' ? '👥' :
                               msg.department?.toUpperCase() === 'CONSTRUCTION' ? '🏗️' :
                               msg.department?.toUpperCase() === 'MANUFACTURING' ? '🏭' :
                               msg.department?.toUpperCase() === 'SYSTEM' ? '⚡' : '🤖'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Agent header with detection badges */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-sm font-semibold ${DEPT_ACCENT[msg.department?.toUpperCase() || ''] || 'text-white'}`}>
                                {msg.department || 'Agent'}
                              </span>
                              {msg.timestamp && (
                                <span className="text-[10px] text-slate-600">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                              {msg.detection?.action && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/5">
                                  {msg.detection.action}
                                </span>
                              )}
                              {msg.detection?.confidence != null && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  msg.detection.confidence >= 0.9 ? 'text-green-400 bg-green-500/10' :
                                  msg.detection.confidence >= 0.7 ? 'text-yellow-400 bg-yellow-500/10' :
                                  'text-red-400 bg-red-500/10'
                                }`}>
                                  {(msg.detection.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                              {msg.detection?.method && (
                                <span className="text-[10px] text-slate-600 italic">via {msg.detection.method}</span>
                              )}
                            </div>

                            {/* Message body with basic markdown */}
                            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                              {msg.text.split('\n').map((line, i) => {
                                // Render bold **text**
                                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                                const rendered = parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                                  }
                                  return <span key={j}>{part}</span>;
                                });
                                // Detect bullet lines
                                const isBullet = /^[\s]*[•\-✓✅❌🔧⚡🏗️🏭👥📋📊📄🏖️📈]/.test(line);
                                return (
                                  <span key={i} className={isBullet ? 'block pl-2 py-0.5' : ''}>
                                    {rendered}
                                    {i < msg.text.split('\n').length - 1 && !isBullet && <br />}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Extracted parameters */}
                            {msg.detection?.parameters && Object.keys(msg.detection.parameters).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {Object.entries(msg.detection.parameters).map(([key, value]) => (
                                  <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-900/60 text-slate-400 font-mono border border-slate-700/50">
                                    <span className="text-slate-500">{key}:</span>
                                    <span className="text-slate-300">{String(value)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* File Download Card */}
                            {(() => {
                              const downloadUrl = msg.data?.downloadUrl || (
                                msg.data?.filename ? (
                                  msg.data.filename.endsWith('.csv') ? `/api/files/csv/${msg.data.filename}` :
                                  msg.data.filename.endsWith('.xlsx') ? `/api/files/excel/${msg.data.filename}` :
                                  msg.data.filename.endsWith('.pdf') ? `/api/files/pdfs/${msg.data.filename}` : null
                                ) : null
                              ) || (() => {
                                const match = msg.text.match(/([a-zA-Z0-9_-]+\.(csv|xlsx|pdf))/i);
                                if (!match) return null;
                                const fn = match[1];
                                const ext = match[2].toLowerCase();
                                const folder = ext === 'csv' ? 'csv' : ext === 'xlsx' ? 'excel' : 'pdfs';
                                return `/api/files/${folder}/${fn}`;
                              })();

                              if (!downloadUrl) return null;

                              const fileName = downloadUrl.split('/').pop() || 'file';
                              const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

                              return (
                                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-construction-gold/30 flex items-center justify-between gap-3 shadow-lg">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-construction-gold/15 border border-construction-gold/30 flex items-center justify-center shrink-0">
                                      <span className="text-xs font-mono font-bold text-construction-gold">{fileExt}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-white truncate">{fileName}</p>
                                      <p className="text-[10px] text-slate-500">Ready for download</p>
                                    </div>
                                  </div>
                                  <a
                                    href={downloadUrl}
                                    download={fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 bg-construction-gold hover:bg-yellow-500 text-black text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-construction-gold/20"
                                  >
                                    <span>📥</span>
                                    <span>Download</span>
                                  </a>
                                </div>
                              );
                            })()}

                            {/* Tools used */}
                            {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Tools</span>
                                {msg.toolsUsed.map(tool => (
                                  <span key={tool} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-construction-gold/8 text-construction-gold border border-construction-gold/15 font-mono">
                                    <span className="opacity-60">⚙</span> {tool}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start rounded-2xl p-4 bg-slate-800/30 border border-slate-700/30"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-construction-gold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-400">Agent</span>
                          <span className="text-[10px] text-slate-600">Routing...</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-slate-500">Analyzing query</span>
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-1 h-1 rounded-full bg-construction-gold/60 animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input area - pinned to bottom */}
            <div className="shrink-0 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
              <div className="max-w-3xl mx-auto">
                {/* @-mention dropdown */}
                <AnimatePresence>
                  {mentionOpen && filteredTools.length > 0 && (
                    <motion.div
                      ref={mentionRef}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="mb-2 bg-slate-800 border border-slate-700/70 rounded-xl shadow-2xl shadow-slate-950/60 overflow-hidden max-h-[280px] overflow-y-auto"
                    >
                      <div className="px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Select a tool</span>
                        <span className="text-[10px] text-slate-600 ml-auto">↑↓ navigate · Enter select · Esc close</span>
                      </div>
                      {/* Group by department */}
                      {(() => {
                        const grouped: Record<string, ToolItem[]> = {}
                        filteredTools.forEach(t => {
                          if (!grouped[t.dept]) grouped[t.dept] = []
                          grouped[t.dept].push(t)
                        })
                        let globalIdx = -1
                        return Object.entries(grouped).map(([dept, tools]) => (
                          <div key={dept}>
                            <div className="px-3 py-1.5 bg-slate-900/50">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${DEPT_TEXT[dept] || 'text-slate-400'}`}>
                                {DEPT_ICONS_MAP[dept] || '🤖'} {DEPT_LABELS[dept] || dept}
                              </span>
                            </div>
                            {tools.map(tool => {
                              globalIdx++
                              const idx = globalIdx
                              return (
                                <button
                                  key={tool.name}
                                  onClick={() => insertMention(tool)}
                                  onMouseEnter={() => setMentionIndex(idx)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                    idx === mentionIndex
                                      ? 'bg-construction-gold/10 text-white'
                                      : 'text-slate-300 hover:bg-slate-700/50'
                                  }`}
                                >
                                  <span className="text-sm opacity-50">⚙</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-mono font-medium">{tool.name}</span>
                                      {idx === mentionIndex && (
                                        <span className="text-[9px] text-construction-gold bg-construction-gold/10 px-1.5 py-0.5 rounded font-medium">Enter ↵</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">{tool.desc}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ))
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative flex items-end bg-slate-800/60 border border-slate-700/50 rounded-2xl focus-within:border-construction-gold/30 focus-within:ring-2 focus-within:ring-construction-gold/10 transition-all shadow-lg shadow-slate-950/50">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 p-4 pr-24 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none disabled:opacity-50 max-h-[150px]"
                    placeholder={isListening ? 'Listening... Speak now...' : 'Message the AI agents... (type @ for tools)'}
                  />
                  {/* Voice input button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Stop recording' : 'Voice input'}
                    className={`absolute right-12 bottom-2 p-2 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 bottom-2 p-2 rounded-xl bg-construction-gold text-black hover:bg-yellow-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-construction-gold shadow-lg shadow-construction-gold/20"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                  Type <span className="text-slate-400 font-mono">@</span> to browse tools · AI routes queries across departments automatically
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Other views */
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {currentView === 'hr' && token && (
                <motion.div key="hr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <HR token={token} />
                </motion.div>
              )}
              {currentView === 'construction' && token && (
                <motion.div key="construction" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Construction token={token} />
                </motion.div>
              )}
              {currentView === 'manufacturing' && token && (
                <motion.div key="manufacturing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Manufacturing token={token} />
                </motion.div>
              )}
              {currentView === 'workflow' && (
                <motion.div key="workflow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Workflow token={token || ''} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

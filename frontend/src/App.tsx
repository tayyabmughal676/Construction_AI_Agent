import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import HR from './components/HR'
import Construction from './components/Construction'
import Manufacturing from './components/Manufacturing'

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  department?: string;
  toolsUsed?: string[];
}

type View = 'chat' | 'hr' | 'construction' | 'manufacturing' | 'workflow'

type AuthView = 'login' | 'signup'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<View>('chat')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' })
  const [authView, setAuthView] = useState<AuthView>('login')

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      setIsLoggedIn(true)
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Auth attempt:', { authView, endpoint: authView === 'login' ? '/auth/login' : '/auth/register', formData: authView === 'login' ? loginForm : signupForm })
    try {
      const endpoint = authView === 'login' ? '/auth/login' : '/auth/register'
      const formData = authView === 'login' ? loginForm : signupForm
      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      console.log('Fetch response:', response.status, response.statusText)
      const data: any = await response.json()
      console.log('Response data:', data)
      if (response.ok) {
        console.log('Auth successful, setting token')
        setToken(data.token)
        localStorage.setItem('token', data.token)
        setIsLoggedIn(true)
        setLoginForm({ email: '', password: '' })
        setSignupForm({ name: '', email: '', password: '' })
      } else {
        console.error('Auth failed:', data.error || 'Unknown error')
        alert(data.error || 'Auth failed')
      }
    } catch (error) {
      console.error('Auth fetch error:', error)
      alert('Auth error')
    }
  }

  const logout = () => {
    setToken(null)
    setIsLoggedIn(false)
    localStorage.removeItem('token')
  }

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, from: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ message: input }),
      })
      const data: any = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        from: 'bot',
        department: data.department,
        toolsUsed: data.toolsUsed,
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Error communicating with AI agent.',
        from: 'bot',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-xl shadow-xl max-w-md w-full"
        >
          <h1 className="text-2xl font-bold text-construction-gold text-center mb-6">
            Construction AI Agent
          </h1>

          <div className="flex mb-6">
            <button
              onClick={() => setAuthView('login')}
              className={`flex-1 py-2 px-4 rounded-l-lg transition-colors ${
                authView === 'login'
                  ? 'bg-construction-gold text-black'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthView('signup')}
              className={`flex-1 py-2 px-4 rounded-r-lg transition-colors ${
                authView === 'signup'
                  ? 'bg-construction-gold text-black'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authView === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={signupForm.name}
                onChange={(e) => setSignupForm(prev => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-construction-gold focus:ring-1 focus:ring-construction-gold transition-colors"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authView === 'login' ? loginForm.email : signupForm.email}
              onChange={(e) =>
                authView === 'login'
                  ? setLoginForm(prev => ({ ...prev, email: (e.target as HTMLInputElement).value }))
                  : setSignupForm(prev => ({ ...prev, email: (e.target as HTMLInputElement).value }))
              }
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-construction-gold focus:ring-1 focus:ring-construction-gold transition-colors"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authView === 'login' ? loginForm.password : signupForm.password}
              onChange={(e) =>
                authView === 'login'
                  ? setLoginForm(prev => ({ ...prev, password: (e.target as HTMLInputElement).value }))
                  : setSignupForm(prev => ({ ...prev, password: (e.target as HTMLInputElement).value }))
              }
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-construction-gold focus:ring-1 focus:ring-construction-gold transition-colors"
              required
            />
            <button
              type="submit"
              className="w-full p-3 bg-construction-gold text-black rounded-lg hover:bg-yellow-500 transition-colors"
            >
              {authView === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <h1 className="text-3xl font-bold text-construction-gold">
          Construction AI Agent Dashboard
        </h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </motion.header>

      <nav className="flex space-x-4 mb-8">
        {[
          { key: 'chat' as View, label: 'Chat' },
          { key: 'hr' as View, label: 'HR Hub' },
          { key: 'construction' as View, label: 'Construction Site' },
          { key: 'manufacturing' as View, label: 'Manufacturing Plant' },
          { key: 'workflow' as View, label: 'Workflow Center' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrentView(key)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === key
                ? 'bg-construction-gold text-black'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {currentView === 'chat' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-xl"
        >
          <h2 className="text-xl mb-4 text-white">Unified Intelligence Terminal</h2>

          <div className="h-96 overflow-y-auto mb-4 p-4 bg-slate-900/50 rounded-lg space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.from === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.from === 'user' ? 'bg-construction-gold text-black' : 'bg-slate-700 text-white'}`}>
                  {msg.from === 'bot' && msg.department && (
                    <div className="text-xs text-slate-400 mb-1">
                      Agent: {msg.department}
                    </div>
                  )}
                  <p>{msg.text}</p>
                  {msg.from === 'bot' && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      Tools used: {msg.toolsUsed.join(', ')}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-700 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-construction-gold"></div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
              className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-l-lg text-white placeholder-slate-400 focus:outline-none focus:border-construction-gold focus:ring-1 focus:ring-construction-gold transition-colors disabled:opacity-50"
              placeholder="Ask the AI agent..."
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-construction-gold text-black rounded-r-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </motion.div>
      )}

      {currentView === 'hr' && token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <HR token={token} />
        </motion.div>
      )}

      {currentView === 'construction' && token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Construction token={token} />
        </motion.div>
      )}

      {currentView === 'manufacturing' && token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Manufacturing token={token} />
        </motion.div>
      )}

      {currentView === 'workflow' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-xl"
        >
          <h2 className="text-xl mb-4 text-white">Workflow Center</h2>
          <p className="text-slate-400">Trigger and monitor LangGraph workflows coming soon...</p>
        </motion.div>
      )}
    </div>
  )
}

export default App

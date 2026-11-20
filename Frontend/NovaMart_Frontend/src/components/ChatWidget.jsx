import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, Sparkles, User, RotateCcw } from 'lucide-react'
import { askNovaAssistant, isNovaDemo } from '../services/aiService'

const welcome = { role: 'assistant', text: 'Xin chào! Mình là Nova — trợ lý công nghệ của NovaMart. Bạn đang tìm thiết bị cho công việc, học tập hay giải trí?' }
const replyLabels = {
  demo: 'Phản hồi demo',
  gemini: 'Gemini qua Spring Boot',
  api: 'Phản hồi qua Spring Boot',
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([welcome])
  const historyRef = useRef(null)
  const requestRef = useRef(null)

  useEffect(() => {
    const openChat = () => setOpen(true)
    window.addEventListener('novamart:open-chat', openChat)
    return () => {
      window.removeEventListener('novamart:open-chat', openChat)
      requestRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const history = historyRef.current
    if (history) history.scrollTop = history.scrollHeight
  }, [messages, busy, error, open])

  const send = async (value = input) => {
    const message = value.trim()
    if (!message || requestRef.current) return
    const request = new AbortController()
    requestRef.current = request
    setMessages((items) => [...items, { role: 'user', text: message }])
    setInput('')
    setError('')
    setBusy(true)
    try {
      const result = await askNovaAssistant(message, { signal: request.signal })
      if (!request.signal.aborted) {
        setMessages((items) => [...items, { role: 'assistant', text: result.reply, provider: result.provider }])
      }
    } catch {
      if (!request.signal.aborted) {
        setError('Không nhận được phản hồi từ trợ lý. Bạn có thể gửi lại câu hỏi.')
        setInput((draft) => draft || message)
      }
    } finally {
      requestRef.current = null
      if (!request.signal.aborted) setBusy(false)
    }
  }

  const reset = () => {
    setMessages([welcome])
    setInput('')
    setError('')
  }

  return (
    <>
      {open && (
        <section id="nova-chat-panel" className="chat-panel" aria-label="Trợ lý Nova">
          <div className="chat-head">
            <div className="chat-avatar"><Bot size={20}/></div>
            <div><strong>Nova Assistant</strong><span>{isNovaDemo ? 'Chế độ demo' : 'Tư vấn qua Spring Boot'}</span></div>
            <button type="button" onClick={reset} disabled={busy} aria-label="Làm mới"><RotateCcw size={16}/></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng"><X size={18}/></button>
          </div>
          <div className="chat-intro"><Sparkles size={14}/> Tư vấn theo nhu cầu, ngân sách và cấu hình</div>
          <div className="chat-messages" ref={historyRef} role="log" aria-label="Lịch sử hội thoại">
            {messages.map((item, index) => (
              <div className={`chat-message ${item.role}`} key={index}>
                <span className="chat-message-icon">{item.role === 'assistant' ? <Bot size={14}/> : <User size={14}/>}</span>
                <p>
                  {item.provider && <><strong>{replyLabels[item.provider]}</strong><br/></>}
                  {item.text}
                </p>
              </div>
            ))}
            {busy && <div className="chat-typing" role="status">Đang gửi câu hỏi và chờ Nova phản hồi…</div>}
            {error && <div className="chat-typing field-error" role="alert">{error}</div>}
          </div>
          <div className="chat-suggestions">
            <button type="button" disabled={busy} onClick={() => send('Tư vấn laptop để lập trình')}>Laptop lập trình</button>
            <button type="button" disabled={busy} onClick={() => send('Tư vấn điện thoại dưới 20 triệu')}>Điện thoại dưới 20 triệu</button>
          </div>
          <form className="chat-input" onSubmit={(event) => { event.preventDefault(); send() }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập nhu cầu của bạn..." aria-label="Câu hỏi cho Nova"/>
            <button type="submit" disabled={!input.trim() || busy} aria-label="Gửi"><Send size={17}/></button>
          </form>
          {isNovaDemo && <div className="chat-note">Chế độ demo trả lời theo từ khóa.</div>}
        </section>
      )}
      <button
        type="button"
        className={`chat-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        aria-expanded={open}
        aria-controls={open ? 'nova-chat-panel' : undefined}
      >
        {open ? <X size={23}/> : <><Sparkles size={18}/><span>Hỏi Nova</span></>}
      </button>
    </>
  )
}

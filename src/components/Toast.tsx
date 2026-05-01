'use client'
import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  show: boolean
}

export function Toast({ message, show }: ToastProps) {
  return (
    <div
      className={`fixed top-14 left-1/2 z-50 pointer-events-none
        flex items-center gap-2 px-3 pr-4 py-2 rounded-full
        bg-ink text-white text-[13px] font-medium whitespace-nowrap
        transition-all duration-200
        ${show
          ? 'opacity-100 -translate-x-1/2 translate-y-0 scale-100'
          : 'opacity-0 -translate-x-1/2 -translate-y-3 scale-95'
        }`}
    >
      {/* WhatsApp-style green tick */}
      <span className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
          <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      {message}
    </div>
  )
}

export function useToast() {
  const [visible, setVisible] = useState(false)
  const [msg, setMsg] = useState('Entry saved')
  let timer: ReturnType<typeof setTimeout>

  function showToast(message = 'Entry saved') {
    setMsg(message)
    setVisible(true)
    clearTimeout(timer)
    timer = setTimeout(() => setVisible(false), 2400)
  }

  useEffect(() => () => clearTimeout(timer), [])

  return { visible, msg, showToast }
}

'use client'
import React, { useState, useRef, useEffect } from 'react'
import { 
  PaperAirplaneIcon as SendIcon,
  Square3Stack3DIcon as StopIcon,
  PaperClipIcon as PaperclipIcon
} from '@heroicons/react/24/outline'

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>
  onStopStreaming?: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isStreaming = false,
  placeholder = "输入您的问题...",
}) => {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动调整输入框高度
  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 200) // 最大高度200px
      textarea.style.height = `${newHeight}px`
    }
  }

  // 处理发送消息
  const handleSend = async () => {
    if (!message.trim() || disabled || isStreaming) return

    const messageToSend = message.trim()
    setMessage('')
    
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await onSendMessage(messageToSend)
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  // 处理输入法
  const handleCompositionStart = () => setIsComposing(true)
  const handleCompositionEnd = () => setIsComposing(false)

  // 停止流式响应
  const handleStop = () => {
    if (onStopStreaming) {
      onStopStreaming()
    }
  }

  // 自动聚焦
  useEffect(() => {
    if (!disabled && !isStreaming && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled, isStreaming])

  // 监听消息变化，调整高度
  useEffect(() => {
    adjustHeight()
  }, [message])

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3 bg-white border border-gray-300 rounded-2xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          {/* 文件上传按钮 */}
          <button
            className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
            title="上传文件"
            disabled={disabled || isStreaming}
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>

          {/* 输入框 */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 py-3 px-0 border-0 outline-none resize-none text-gray-900 placeholder-gray-400 max-h-[200px] min-h-[24px] bg-transparent"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#e5e7eb #f9fafb',
            }}
          />

          {/* 发送/停止按钮 */}
          <div className="flex-shrink-0 pr-2">
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                title="停止生成"
              >
                <StopIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                className={`p-3 rounded-lg transition-all ${
                  message.trim() && !disabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title="发送消息 (Enter)"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 提示文本 */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>
            <span>Enter 发送，Shift + Enter 换行</span>
          </div>
          <div className="flex gap-4">
            <span>支持 Markdown</span>
            <span>AI 可能产生错误信息</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageInput
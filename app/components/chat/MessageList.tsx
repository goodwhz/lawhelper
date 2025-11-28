'use client'
import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type { ChatMessage } from './types'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming?: boolean
  onRate?: (messageId: string, rating: 'like' | 'dislike', reason?: string) => Promise<void>
  onRegenerate?: (messageId: string) => Promise<void>
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming = false,
  onRate,
  onRegenerate,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 监听消息变化，自动滚动
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100) // 延迟滚动，确保内容渲染完成

    return () => clearTimeout(timer)
  }, [messages.length, isStreaming])

  // 如果没有消息，显示欢迎界面
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              CoolBrain-LaborLawhelper
            </h2>
            <p className="text-gray-600">
              专业的劳动法智能咨询，24小时为您解答劳动法相关问题
            </p>
          </div>

          {/* 常见问题建议 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-4">您可以这样问我：</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                试用期被辞退有补偿吗？
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                加班费如何计算？
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                年假天数怎么确定？
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                工伤认定流程是什么？
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb #f9fafb' }}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRate={onRate}
            onRegenerate={onRegenerate}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
          />
        ))}
        
        {/* 流式加载状态 */}
        {isStreaming && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                AI
              </div>
              <div className="relative">
                <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm animate-pulse">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
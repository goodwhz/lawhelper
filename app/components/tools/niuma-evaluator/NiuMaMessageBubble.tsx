'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import type { MessageBubbleProps } from '../types'

const NiuMaMessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onCopy,
  onLike,
  onDislike,
  onRegenerate,
}) => {
  const [isCopied, setIsCopied] = useState(false)
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(
    message.feedback?.liked ? 'liked' : message.feedback?.disliked ? 'disliked' : null,
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setIsCopied(true)
      onCopy?.()
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleLike = () => {
    if (feedback === 'liked') {
      setFeedback(null)
      onLike?.()
    } else {
      setFeedback('liked')
      onDislike?.()
    }
  }

  const handleDislike = () => {
    if (feedback === 'disliked') {
      setFeedback(null)
      onDislike?.()
    } else {
      setFeedback('disliked')
      onLike?.()
    }
  }

  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
            : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
        }`}
      >
        {/* 消息内容 */}
        {isUser
          ? (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
          )
          : (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-ul:text-gray-800 prose-ol:text-gray-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={{
                  h1: ({ children }: { children: React.ReactNode }) => (
                    <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
                  ),
                  h2: ({ children }: { children: React.ReactNode }) => (
                    <h2 className="text-base font-semibold mb-2 mt-2">{children}</h2>
                  ),
                  h3: ({ children }: { children: React.ReactNode }) => (
                    <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>
                  ),
                  p: ({ children }: { children: React.ReactNode }) => (
                    <p className="text-gray-800 leading-relaxed mb-2">{children}</p>
                  ),
                  ul: ({ children }: { children: React.ReactNode }) => (
                    <ul className="list-disc pl-5 mb-2 text-gray-800 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }: { children: React.ReactNode }) => (
                    <ol className="list-decimal pl-5 mb-2 text-gray-800 space-y-1">{children}</ol>
                  ),
                  li: ({ children }: { children: React.ReactNode }) => (
                    <li className="text-gray-800">{children}</li>
                  ),
                  strong: ({ children }: { children: React.ReactNode }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  blockquote: ({ children }: { children: React.ReactNode }) => (
                    <blockquote className="border-l-4 border-pink-400 pl-3 my-2 bg-pink-50/50 py-1 pr-3 text-gray-700">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }: { children: React.ReactNode }) => (
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800 font-mono">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content + (isStreaming ? '▍' : '')}
              </ReactMarkdown>
            </div>
          )}

        {/* 消息操作栏（仅 AI 消息） */}
        {!isUser && !isStreaming && (
          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
            {/* 复制按钮 */}
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg transition-colors ${
                isCopied
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title="复制"
            >
              {isCopied
                ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )
                : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
            </button>

            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'liked'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title="点赞"
            >
              <svg className="w-4 h-4" fill={feedback === 'liked' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115 26H5a2 2 0 01-2-2v-4a2 2 0 012-2h4zM14 10V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>

            {/* 点踩按钮 */}
            <button
              onClick={handleDislike}
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'disliked'
                  ? 'bg-red-100 text-red-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title="点踩"
            >
              <svg className="w-4 h-4" fill={feedback === 'disliked' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l-3.5-7A2 2 0 015 2h4.236zM10 14V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>

            {/* 重新生成按钮 */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="重新生成"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 时间戳 */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-pink-100' : 'text-gray-400'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}

export default NiuMaMessageBubble

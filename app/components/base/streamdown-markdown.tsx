'use client'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import React from 'react'

interface StreamdownMarkdownProps {
  content: string
  className?: string
}

// 自定义渲染器，用于处理法律文件名称的红色高亮
const LegalTextRenderer = ({ content }: { content: string }) => {
  let processedContent = content

  // 处理Markdown标题格式：去除 ### ** 和 ** 标记
  processedContent = processedContent.replace(/### \*\*([^*]+)\*\*/g, '<h3 style="font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h3>')
  processedContent = processedContent.replace(/#### \*\*([^*]+)\*\*/g, '<h4 style="font-size: 1.1rem; font-weight: bold; margin: 0.8rem 0 0.4rem 0;">$1</h4>')

  // 处理普通Markdown标题
  processedContent = processedContent.replace(/### (.+)/g, '<h3 style="font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h3>')
  processedContent = processedContent.replace(/#### (.+)/g, '<h4 style="font-size: 1.1rem; font-weight: bold; margin: 0.8rem 0 0.4rem 0;">$1</h4>')

  // 处理书名号标记的法律文件名称（红色加粗，不换行）
  processedContent = processedContent.replace(/《([^》]+)》/g, '<span style="color: #e53e3e; font-weight: bold;">《$1》</span>')

  // 处理双星号标记，去掉标记并加深文字，同时自动换行
  // 将数字后的**紧跟在数字后面，防止换行，并确保冒号在同一行
  processedContent = processedContent.replace(/(\d+)\.\*\*([^*]+)\*\*：/g, '$1.**$2**：')
  processedContent = processedContent.replace(/(\d+)\.\*\*([^*]+)\*\*/g, '$1.**$2**')

  // 处理普通双星号标记，去掉标记并加深文字，不换行
  processedContent = processedContent.replace(/\*\*([^*]+)\*\*/g, '<span style="font-weight: bold; margin: 0.2rem 0;">$1</span>')
  processedContent = processedContent.replace(/-\*\* ([^*]+) \*\*/g, '<span style="font-weight: bold; margin: 0.2rem 0;">$1</span>')

  // 处理书名号标记（不换行）
  processedContent = processedContent.replace(/《([^》]+)》/g, '<span style="color: #e53e3e; font-weight: bold;">《$1》</span>')

  // 处理列表项，在-前面添加换行
  processedContent = processedContent.replace(/\n- /g, '\n<br>- ')
  processedContent = processedContent.replace(/^- \*\*([^*]+)\*\*/g, '<li style="margin: 0.3rem 0;"><strong>$1</strong></li>')
  processedContent = processedContent.replace(/^- (.+)/g, '<li style="margin: 0.3rem 0;">$1</li>')

  // 保持：与-** **在同一行
  processedContent = processedContent.replace(/(<span style=[^>]+>)([^：]+)(：)/g, '$1$2$3')

  // 处理水平分割线
  processedContent = processedContent.replace(/---/g, '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e5e7eb;">')

  // 包装列表
  processedContent = processedContent.replace(/<li/g, '<ul style="padding-left: 1.5rem; margin: 0.5rem 0;"><li')
  processedContent = processedContent.replace(/<\/li>/g, '</li></ul>')

  return (
    <div dangerouslySetInnerHTML={{ __html: processedContent }} />
  )
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  // 检查内容是否包含书名号、双星号或Markdown标记
  const hasLegalMarkers = /《[^》]+》|\*\*[^*]+\*\*|###|####|---|^-/.test(content)

  return (
    <div className={`streamdown-markdown ${className}`}>
      {hasLegalMarkers
        ? (
          <LegalTextRenderer content={content} />
        )
        : (
          <Streamdown>{content}</Streamdown>
        )
      }</div>
  )
}

export default StreamdownMarkdown

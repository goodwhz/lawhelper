'use client'
import type { FC } from 'react'
import React from 'react'

interface WeChatModalProps {
  isOpen: boolean
  onClose: () => void
}

const WeChatModal: FC<WeChatModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) { return null }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* 模态框头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">微信客服咨询</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">扫描下方二维码添加CoolBrain微信客服</p>

            {/* 微信二维码图片 */}
            <div className="bg-gray-100 p-4 rounded-lg inline-block">
              <img
                src="/wechat-qr.png"
                alt="CoolBrain微信客服二维码"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  // 如果图片加载失败，显示占位符
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2NEgxMTJWODBIMTA0Vjk2SDk2VjExMkg4OFYxMjhIODBWNjRaIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0xMTIgNjRIMTI4VjgwSDE0NFY5NkgxNTJWMTEySDE2MFYxMjhIMTY4VjE0NEgxNzZWMTYwSDE4NFYxNzZIMTkyVjE5MkgxMTJWNjRaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo='
                }}
              />
            </div>

            <p className="text-sm text-gray-500 mt-4">
              添加后即可进行在线咨询
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="bg-law-red-500 text-white px-6 py-2 rounded-lg hover:bg-law-red-600 transition-colors font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeChatModal

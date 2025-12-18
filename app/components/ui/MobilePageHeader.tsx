'use client'

import React from 'react'
import BackToHomeButton from './BackToHomeButton'

interface MobilePageHeaderProps {
  title?: string
  showBackButton?: boolean
  rightContent?: React.ReactNode
  className?: string
}

/**
 * 移动端页面头部组件
 * 在移动端显示返回按钮和页面标题
 */
const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  showBackButton = true,
  rightContent,
  className = ''
}) => {
  return (
    <div className={`lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* 左侧：返回按钮 */}
        <div className="flex items-center">
          {showBackButton && <BackToHomeButton variant="mobile" />}
        </div>
        
        {/* 中间：标题 */}
        {title && (
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 truncate px-4">
              {title}
            </h1>
          </div>
        )}
        
        {/* 右侧：自定义内容 */}
        <div className="flex items-center">
          {rightContent}
        </div>
      </div>
    </div>
  )
}

export default MobilePageHeader
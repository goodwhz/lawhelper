'use client'
import type { FC, ReactNode } from 'react'
import React from 'react'

interface MobileResponsiveContainerProps {
  children: ReactNode
  className?: string
  mobileClassName?: string
  tabletClassName?: string
  desktopClassName?: string
}

/**
 * 移动端响应式容器组件
 * 根据不同屏幕尺寸应用不同的样式
 */
const MobileResponsiveContainer: FC<MobileResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}) => {
  return (
    <div className={`
      ${className}
      ${mobileClassName} // 移动端 (320px+)
      sm:${tabletClassName} // 平板 (640px+)
      lg:${desktopClassName} // 桌面 (1024px+)
    `}>
      {children}
    </div>
  )
}

export default MobileResponsiveContainer
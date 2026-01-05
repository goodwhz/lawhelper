'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const FloatingNiuMa: React.FC = () => {
  const router = useRouter()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const mouseDownCoordRef = useRef({ x: 0, y: 0 })
  const positionRef = useRef(position)

  // 同步 position 到 ref
  useEffect(() => {
    positionRef.current = position
  }, [position])

  // 初始化位置到右下角
  useEffect(() => {
    if (position.x === 0 && position.y === 0) {
      const newX = window.innerWidth - 84
      const newY = window.innerHeight - 84
      setPosition({ x: newX, y: newY })
    }
  }, [position])

  // 鼠标按下开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    mouseDownCoordRef.current = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  // 鼠标移动处理拖动
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) { return }

    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y

    // 限制在屏幕范围内
    const maxX = window.innerWidth - 68
    const maxY = window.innerHeight - 68

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  // 鼠标松开停止拖动
  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      // 计算移动距离
      const moveDistance = Math.sqrt(
        (e.clientX - mouseDownCoordRef.current.x) ** 2
        + (e.clientY - mouseDownCoordRef.current.y) ** 2,
      )
      // 如果移动距离小于5px，认为是点击
      if (moveDistance < 5) {
        router.push('/niu-ma-evaluator')
      }
    }
    setIsDragging(false)
  }

  // 添加和移除鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      className="fixed z-50 cursor-move select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        title="牛马测评仪"
        className={`w-16 h-16 rounded-full shadow-[0_0_25px_rgba(249,168,212,0.4)] hover:shadow-[0_0_35px_rgba(249,168,212,0.6)] bg-gradient-to-br from-pink-400 via-rose-300 to-pink-500 hover:from-pink-500 hover:via-rose-400 hover:to-pink-600 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 border-2 border-white/90 animate-subtle-pulse ${isDragging ? 'ring-4 ring-pink-200 ring-opacity-50' : ''}`}
      >
        <span className="text-2xl flex flex-col items-center leading-tight font-semibold text-white drop-shadow-md">
          <span>🐂🐴</span>
          <span className="text-sm mt-1 font-medium tracking-wide">测评</span>
        </span>
      </div>
    </div>
  )
}

export default FloatingNiuMa

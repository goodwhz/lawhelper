'use client'
import { useState, useEffect } from 'react'

/**
 * 移动端检测 Hook
 * @param breakpoint 断点大小，默认为 1024px (lg)
 * @returns 是否为移动端
 */
export const useIsMobile = (breakpoint: number = 1024) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

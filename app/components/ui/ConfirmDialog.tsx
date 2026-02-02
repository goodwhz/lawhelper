import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) { return null }

  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: (
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.318 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          titleColor: 'text-red-900',
          buttonBgColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        }
      case 'warning':
        return {
          icon: (
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.318 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          titleColor: 'text-yellow-900',
          buttonBgColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        }
      case 'info':
      default:
        return {
          icon: (
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          titleColor: 'text-blue-900',
          buttonBgColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        }
    }
  }

  const { icon, bgColor, titleColor, buttonBgColor } = getIconAndColors()

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999]">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
        <div className="mt-3 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColor}`}>
            {icon}
          </div>
          <h3 className={`mt-4 text-lg leading-6 font-medium ${titleColor}`}>
            {title || '确认操作'}
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 ${buttonBgColor} text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading
                ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                  </span>
                )
                : '确认'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

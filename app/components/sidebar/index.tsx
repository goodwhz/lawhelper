import React, { useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import Button from '@/app/components/base/button'
// import Card from './card'
import type { ConversationItem } from '@/types/app'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

const MAX_CONVERSATION_LENTH = 20

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
  onDeleteConversation?: (id: string) => void
  onPinConversation?: (id: string, isPinned: boolean) => void
  onRenameConversation?: (id: string, newName: string) => void
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  list,
  onDeleteConversation,
  onPinConversation,
  onRenameConversation,
}) => {
  const { t } = useTranslation()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleRenameStart = (item: ConversationItem) => {
    setRenamingId(item.id)
    setRenameValue(item.name)
  }

  const handleRenameSave = (item: ConversationItem) => {
    if (renameValue.trim() && renameValue !== item.name && onRenameConversation) {
      onRenameConversation(item.id, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleRenameCancel = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent, item: ConversationItem) => {
    if (e.key === 'Enter') {
      handleRenameSave(item)
    } else if (e.key === 'Escape') {
      handleRenameCancel()
    }
  }

  // 将置顶的对话放在最前面
  const sortedList = [...list].sort((a, b) => {
    if (a.isPinned && !b.isPinned) { return -1 }
    if (!a.isPinned && b.isPinned) { return 1 }
    return 0
  })

  return (
    <div
      className="shrink-0 flex flex-col overflow-y-auto bg-white pc:w-[244px] tablet:w-[192px] mobile:w-[240px]  border-r border-gray-200 tablet:h-[calc(100vh_-_3rem)] mobile:h-screen"
    >
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="flex flex-shrink-0 p-4 !pb-0">
          <Button
            onClick={() => { onCurrentIdChange('-1') }}
            className="group block w-full flex-shrink-0 !justify-start !h-9 text-law-red-600 items-center text-sm"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <nav className="flex-1 bg-white p-4 !pt-0">
        {sortedList.map((item) => {
          const isCurrent = item.id === currentId
          const isRenaming = renamingId === item.id
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon

          return (
            <div
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-law-red-50 text-gray-900'
                  : 'text-gray-900 hover:bg-gray-100 hover:text-gray-900',
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium cursor-pointer relative',
              )}
              onClick={(e) => {
                if (!isRenaming) {
                  onCurrentIdChange(item.id)
                }
              }}
            >
              <ItemIcon
                className={classNames(
                  isCurrent
                    ? 'text-law-red-600'
                    : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-5 w-5 flex-shrink-0',
                )}
                aria-hidden="true"
              />

              {isRenaming
                ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => handleKeyPress(e, item)}
                    onBlur={() => handleRenameSave(item)}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    autoFocus
                  />
                )
                : (
                  <span className="flex-1 truncate">{item.name}</span>
                )}

              {/* 操作图标 - 仅在悬停时显示 */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                {/* 置顶图标 */}
                {onPinConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPinConversation(item.id, !item.isPinned)
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title={item.isPinned ? '取消置顶' : '置顶'}
                  >
                    {item.isPinned
                      ? (
                        <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                      )
                      : (
                        <StarIcon className="h-4 w-4 text-gray-500" />
                      )}
                  </button>
                )}

                {/* 重命名图标 */}
                {onRenameConversation && !isRenaming && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRenameStart(item)
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="重命名"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}

                {/* 删除图标 */}
                {onDeleteConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(item.id)
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="删除"
                  >
                    <TrashIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* 置顶标识 */}
              {item.isPinned && (
                <div className="absolute top-1 right-1">
                  <StarSolidIcon className="h-3 w-3 text-yellow-500" />
                </div>
              )}
            </div>
          )
        })}
      </nav>
      {/* <a className="flex flex-shrink-0 p-4" href="https://langgenius.ai/" target="_blank">
        <Card><div className="flex flex-row items-center"><ChatBubbleOvalLeftEllipsisSolidIcon className="text-primary-600 h-6 w-6 mr-2" /><span>LangGenius</span></div></Card>
      </a> */}
      <div className="flex flex-shrink-0 pr-4 pb-4 pl-4">
        <div className="text-gray-400 font-normal text-xs">© {copyRight} {(new Date()).getFullYear()}</div>
      </div>
    </div>
  )
}

export default React.memo(Sidebar)

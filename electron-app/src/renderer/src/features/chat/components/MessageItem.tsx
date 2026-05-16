import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '@shared/types'

import ToolCallBubble from './ToolCallBubble'

interface Props {
  message: Message
}

/** Small sparkle SVG used for the AI avatar */
function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z"
        fill="#c4737a"
      />
    </svg>
  )
}

export default function MessageItem({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex items-end gap-2.5 max-w-[92%] ${isUser ? 'justify-end ml-auto' : 'justify-start'}`}
      data-testid={isUser ? 'user-message' : 'assistant-message'}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f2dde3] to-[#eef5f7] flex items-center justify-center flex-shrink-0 mb-0.5">
          <SparkleIcon />
        </div>
      )}

      {isUser ? (
        /* User message */
        <div>
          <div
            className="bubble-user bg-[#c4737a] text-white px-3.5 py-3 text-[14px] leading-relaxed"
            style={{ boxShadow: '0 4px 16px rgba(196,115,122,0.28)' }}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[10px] text-[#a49494] mt-1 mr-1 text-right">
            {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ) : (
        /* AI message */
        <div>
          <div
            className="bubble-ai bg-white/90 border border-[rgba(196,115,122,0.12)] px-3.5 py-3 text-[14px] text-[#1c1614] leading-relaxed"
            style={{
              boxShadow: '0 1px 3px rgba(28,22,20,0.04), 0 4px 12px rgba(196,115,122,0.06)',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ children }) {
                  return (
                    <pre className="bg-[#fdf0f2] rounded-lg p-3 overflow-x-auto my-2 text-xs font-mono">
                      {children}
                    </pre>
                  )
                },
                code({ className, children }) {
                  return (
                    <code
                      className={`bg-[#fdf0f2] px-1.5 py-0.5 rounded text-xs font-mono ${className ?? ''}`}
                    >
                      {children}
                    </code>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      className="text-[#c4737a] underline"
                      onClick={e => e.preventDefault()}
                    >
                      {children}
                    </a>
                  )
                },
              }}
            >
              {message.content || '\u25ae'}
            </ReactMarkdown>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolCallBubble toolCalls={message.toolCalls} />
            )}
          </div>
          <p className="text-[10px] text-[#a49494] mt-1 ml-1">
            {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  )
}

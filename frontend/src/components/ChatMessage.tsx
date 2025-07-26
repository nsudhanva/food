import type { Message } from '@/types'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
    message: Message
}

export function ChatMessage({ message }: Props) {
    const isUser = message.role === 'user'

    return (
        <div className={cn('flex gap-4 md:gap-6 px-4 md:px-0 py-6 md:py-8 w-full max-w-3xl mx-auto', isUser ? 'flex-row-reverse' : '')}>
            {/* Avatar */}
            <div
                className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
                    isUser
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                        : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20'
                )}
            >
                {isUser ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                )}
            </div>

            {/* Message Content */}
            <div
                className={cn(
                    'flex-1 min-w-0 overflow-hidden text-sm md:text-base leading-relaxed',
                    isUser
                        ? 'bg-blue-600/10 text-blue-100 rounded-2xl px-6 py-4 border border-blue-500/20'
                        : 'pt-1'
                )}
            >
                {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                    <div className="space-y-4 text-slate-200">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0 pb-2 border-b border-slate-700/50">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-semibold text-orange-100 mb-3 mt-6 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-lg font-medium text-orange-200/90 mb-2 mt-4">{children}</h3>,
                                p: ({ children }) => <p className="text-slate-300 leading-7">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-slate-300 marker:text-orange-500/70">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-slate-300 marker:text-orange-500/70">{children}</ol>,
                                li: ({ children }) => <li className="pl-1">{children}</li>,
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-orange-500/30 pl-4 py-1 my-4 italic text-slate-400 bg-slate-800/30 rounded-r-lg">
                                        {children}
                                    </blockquote>
                                ),
                                code: ({ children }) => (
                                    <code className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-300 font-mono text-sm border border-slate-700/50">
                                        {children}
                                    </code>
                                ),
                                pre: ({ children }) => (
                                    <pre className="overflow-x-auto bg-slate-900/80 p-4 rounded-xl border border-slate-800 my-4 text-sm font-mono scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                        {children}
                                    </pre>
                                ),
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-4 transition-colors">
                                        {children}
                                    </a>
                                ),
                                table: ({ children }) => (
                                    <div className="overflow-x-auto my-6 rounded-lg border border-slate-700/50 shadow-sm">
                                        <table className="min-w-full divide-y divide-slate-700/50 text-left text-sm">
                                            {children}
                                        </table>
                                    </div>
                                ),
                                thead: ({ children }) => <thead className="bg-slate-800/80 text-orange-100 font-semibold">{children}</thead>,
                                tbody: ({ children }) => <tbody className="divide-y divide-slate-700/50 bg-slate-900/20">{children}</tbody>,
                                tr: ({ children }) => <tr className="hover:bg-slate-800/30 transition-colors">{children}</tr>,
                                th: ({ children }) => <th className="px-4 py-3 text-left font-medium tracking-wide">{children}</th>,
                                td: ({ children }) => <td className="px-4 py-3 align-top text-slate-300">{children}</td>,
                                hr: () => <hr className="my-8 border-slate-800" />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    )
}

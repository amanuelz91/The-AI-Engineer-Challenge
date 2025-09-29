/**
 * Individual chat message component
 */

import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] px-4 py-3 rounded-2xl break-words',
        isUser 
          ? 'bg-blue-600 text-white rounded-br-md' 
          : 'bg-gray-100 text-gray-900 rounded-bl-md'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p className={cn(
          'text-xs mt-2 opacity-70',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}

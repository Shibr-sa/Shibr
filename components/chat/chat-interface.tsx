"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  conversationId: Id<"conversations">
  currentUserId: Id<"users">
  currentUserType: "brand-owner" | "store-owner"
  otherUserName: string
  shelfName: string
}

export function ChatInterface({
  conversationId,
  currentUserId,
  currentUserType,
  otherUserName,
  shelfName,
}: ChatInterfaceProps) {
  const { t, language, direction } = useLanguage()
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Fetch conversation details
  const conversation = useQuery(api.chats.getConversation, { conversationId })
  
  // Fetch messages
  const messages = useQuery(api.chats.getMessages, { conversationId })
  const sendMessage = useMutation(api.chats.sendMessage)
  const markAsRead = useMutation(api.chats.markMessagesAsRead)
  
  // Check if conversation is archived
  useEffect(() => {
    if (conversation?.status === "archived") {
      setIsArchived(true)
    }
  }, [conversation])
  
  // Mark messages as read immediately when component mounts
  useEffect(() => {
    if (conversationId && currentUserId) {
      markAsRead({ conversationId })
    }
  }, [conversationId, currentUserId])
  
  // Mark messages as read when new messages arrive
  useEffect(() => {
    if (conversationId && currentUserId && messages && messages.length > 0) {
      // Mark as read immediately when messages change
      markAsRead({ conversationId })
    }
  }, [conversationId, currentUserId, messages?.length])
  
  // Set up interval to mark messages as read while dialog is open
  useEffect(() => {
    if (!conversationId || !currentUserId) return
    
    // Mark as read every 2 seconds while the chat is open
    const interval = setInterval(() => {
      markAsRead({ conversationId })
    }, 2000)
    
    return () => clearInterval(interval)
  }, [conversationId, currentUserId])
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.parentElement
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])
  
  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setIsTyping(true)
    try {
      await sendMessage({
        conversationId,
        senderId: currentUserId,
        text: message,
      })
      setMessage("")
      // Keep focus on input field after sending
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsTyping(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  return (
    <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          <div className="space-y-4" ref={scrollAreaRef}>
            {messages?.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p className={`text-sm `}>
                  {`${t("chat.start_conversation_about")} ${shelfName}`}
                </p>
              </div>
            ) : (
              messages?.map((msg) => {
                // Check if message is from current user by comparing profile IDs
                const conversation = messages[0]?.conversationId ? 
                  messages.find(m => m.conversationId === conversationId) : null
                
                const isCurrentUser = currentUserType === "brand-owner" 
                  ? msg.senderType === "brand" 
                  : msg.senderType === "store"
                  
                const isSystem = msg.senderType === "system"
                
                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex",
                      isSystem ? "justify-center" : isCurrentUser ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg p-3",
                        isSystem
                          ? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 max-w-md text-center"
                          : isCurrentUser
                          ? "bg-primary text-primary-foreground max-w-xs"
                          : "bg-muted max-w-xs"
                      )}
                    >
                      <p className={cn(
                        "text-sm whitespace-pre-wrap",
                        isSystem && "font-medium text-amber-900 dark:text-amber-100"
                      )}>
                        {msg.text}
                      </p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        isSystem && "text-amber-700 dark:text-amber-300"
                      )}>
                        {format(new Date(msg._creationTime), "p", {
                          locale: language === "ar" ? ar : enUS,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        
        {isArchived ? (
          <div className="p-4 border-t bg-muted">
            <p className={`text-center text-sm text-muted-foreground `}>
              {t("chat.conversation_closed")}
            </p>
          </div>
        ) : (
          <div className="p-4 border-t">
            <div className="relative">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("marketplace.details.type_message")}
                className={`pe-20 `}
                disabled={isTyping || isArchived}
              />
              <div className="absolute end-2 top-1/2 -translate-y-1/2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isTyping || isArchived}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
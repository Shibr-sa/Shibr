"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Send } from "lucide-react"
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
  
  // Fetch conversation details
  const conversation = useQuery(api.chats.getConversation, { conversationId })
  
  // Fetch messages
  const messages = useQuery(api.chats.getMessages, { conversationId })
  const sendMessage = useMutation(api.chats.sendMessage)
  const markAsRead = useMutation(api.chats.markMessagesAsRead)
  
  // Check if conversation is archived or rejected
  useEffect(() => {
    if (conversation?.status === "archived" || conversation?.status === "rejected") {
      setIsArchived(true)
    }
  }, [conversation])
  
  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId && currentUserId) {
      markAsRead({ conversationId, userId: currentUserId })
    }
  }, [conversationId, currentUserId, markAsRead])
  
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
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt={otherUserName} />
            <AvatarFallback >
              {otherUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className={`font-semibold `}>
              {otherUserName}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          <div className="space-y-4" ref={scrollAreaRef}>
            {messages?.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p className={`text-sm `}>
                  {language === "ar" 
                    ? `ابدأ محادثة حول ${shelfName}`
                    : `Start a conversation about ${shelfName}`}
                </p>
              </div>
            ) : (
              messages?.map((msg) => {
                const isCurrentUser = msg.senderId === currentUserId
                const isSystem = msg.messageType !== "text"
                
                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs rounded-lg p-3",
                        isSystem
                          ? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 w-full max-w-sm"
                          : isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-background shadow-sm"
                      )}
                    >
                      {isSystem && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {msg.messageType === "rental_request" && t("chat.status.new")}
                            {msg.messageType === "rental_accepted" && t("status.active")}
                            {msg.messageType === "rental_rejected" && t("status.rejected")}
                          </Badge>
                        </div>
                      )}
                      <p className={`text-sm  whitespace-pre-wrap`}>
                        {msg.text}
                      </p>
                      <p className={`text-xs mt-1 opacity-70 `}>
                        {format(new Date(msg.createdAt), "p", {
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
              {language === "ar" 
                ? "هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة"
                : "This conversation is closed and new messages cannot be sent"}
            </p>
          </div>
        ) : (
          <div className="p-4 border-t">
            <div className="relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("marketplace.details.type_message")}
                className={`pe-20 `}
                disabled={isTyping || isArchived}
              />
              <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
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
      </CardContent>
    </Card>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  ChevronLeft
} from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

interface ChatFabWidgetProps {
  className?: string
}

export function ChatFabWidget({ className }: ChatFabWidgetProps) {
  const { t, language } = useLanguage()
  const { user } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null)
  const [message, setMessage] = useState("")
  const [showConversationsList, setShowConversationsList] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get userId as Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch conversations - use admin-only for store owners
  const conversations = useQuery(
    user?.accountType === "store_owner" ? api.chats.getAdminConversations : api.chats.getUserConversations,
    userId ? { userId } : "skip"
  )

  // Get selected conversation details
  const activeConversation = conversations?.find(c => c._id === selectedConversation)

  // Fetch messages for selected conversation
  const messages = useQuery(
    api.chats.getMessages,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  )

  // Mutations
  const sendMessage = useMutation(api.chats.sendMessage)
  const markAsRead = useMutation(api.chats.markMessagesAsRead)

  // Calculate total unread count
  const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedConversation && userId) {
      markAsRead({ conversationId: selectedConversation })
    }
  }, [selectedConversation, userId, markAsRead])

  // Listen for external events to open chat
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { partnerId, partnerName } = event.detail
      
      // Open the chat widget
      setIsOpen(true)
      
      // Find the conversation with this partner
      const conversation = conversations?.find(c => c.otherUserId === partnerId)
      
      if (conversation) {
        // If conversation exists, select it
        setSelectedConversation(conversation._id)
        setShowConversationsList(false)
      } else {
        // If no conversation exists, show conversations list
        // You might want to create a new conversation here
        setShowConversationsList(true)
      }
    }

    window.addEventListener('openChat' as any, handleOpenChat)
    
    return () => {
      window.removeEventListener('openChat' as any, handleOpenChat)
    }
  }, [conversations])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || !userId) return

    try {
      await sendMessage({
        conversationId: selectedConversation,
        senderId: userId,
        text: message,
      })
      setMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleSelectConversation = (conversationId: Id<"conversations">) => {
    setSelectedConversation(conversationId)
    setShowConversationsList(false)
  }

  const handleBackToList = () => {
    setShowConversationsList(true)
    setSelectedConversation(null)
  }

  if (!userId) return null

  // For store owners, only show FAB if there are admin conversations with unread messages
  if (user?.accountType === "store_owner" && (!conversations || conversations.length === 0)) {
    return null
  }

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 end-6 z-50",
            "bg-primary text-primary-foreground",
            "rounded-full p-4 shadow-lg",
            "hover:bg-primary/90 transition-all",
            "flex items-center justify-center",
            className
          )}
        >
          <MessageSquare className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -end-2 min-w-[24px] h-6 px-2"
            >
              {totalUnread}
            </Badge>
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card 
          className={cn(
            "fixed z-50 shadow-2xl",
            isExpanded 
              ? "inset-4 md:inset-8" 
              : "bottom-6 end-6 w-[380px] h-[600px] max-h-[80vh]",
            "flex flex-col",
            "transition-all duration-300",
            className
          )}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {!showConversationsList && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              )}
              <CardTitle className={cn(
                "text-xl font-semibold",
                              )}>
                {showConversationsList 
                  ? t("chat.conversations")
                  : activeConversation?.otherUserName || t("chat.chat")
                }
              </CardTitle>
              {totalUnread > 0 && showConversationsList && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnread}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            {showConversationsList ? (
              // Conversations List
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {conversations && conversations.length > 0 ? (
                    conversations.map((conversation) => (
                      <button
                        key={conversation._id}
                        onClick={() => handleSelectConversation(conversation._id)}
                        className={cn(
                          "w-full text-start p-3 rounded-lg",
                          "hover:bg-muted transition-colors",
                          "border border-transparent hover:border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {conversation.otherUserName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={cn(
                                "font-medium truncate",
                                                              )}>
                                {conversation.otherUserName}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.shelfName}
                            </p>
                            {conversation.lastMessageText && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {conversation.lastMessageText}
                              </p>
                            )}
                            {conversation.lastMessageTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(
                                  new Date(conversation.lastMessageTime),
                                  "MMM d, h:mm a",
                                  { locale: language === "ar" ? ar : enUS }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {t("chat.no_conversations")}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              // Chat Messages
              <div className="flex flex-col h-full">
                {/* Shelf Info Bar */}
                {activeConversation && (
                  <div className="p-3 bg-muted/50 border-b">
                    <p className="text-sm font-medium">
                      {activeConversation.shelfName}
                    </p>
                  </div>
                )}

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages?.map((msg) => {
                      const isCurrentUser = msg.senderId === userId
                      const messageDate = new Date(msg.createdAt)

                      return (
                        <div
                          key={msg._id}
                          className={cn(
                            "flex gap-2",
                            isCurrentUser ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {msg.senderName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {!isCurrentUser && (
                              <p className="text-xs font-medium mb-1">
                                {msg.senderName}
                              </p>
                            )}
                            <p className={cn(
                              "text-sm whitespace-pre-wrap",
                                                          )}>
                              {msg.text}
                            </p>
                            <p className={cn(
                              "text-xs mt-1",
                              isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(messageDate, "h:mm a", {
                                locale: language === "ar" ? ar : enUS
                              })}
                            </p>
                          </div>
                          {isCurrentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user?.fullName?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {activeConversation?.status === "archived" ? (
                  <div className="p-4 border-t bg-muted">
                    <p className={cn(
                      "text-center text-sm text-muted-foreground",
                                          )}>
                      {language === "ar" 
                        ? "هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة"
                        : "This conversation is closed and new messages cannot be sent"}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("chat.type_message_placeholder")}
                        className={cn(
                          "flex-1",
                                                  )}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
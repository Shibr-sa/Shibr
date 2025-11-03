"use client"

import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, MessageSquare, Send, Download, Check, X, User, Building2, Globe, Instagram, Twitter } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatDate, formatDuration } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export interface RentalRequestDetails {
  _id: Id<"rentalRequests">
  shelfId: Id<"shelves">
  brandOwnerId?: Id<"users">
  storeOwnerId?: Id<"users">
  otherUserId?: Id<"users">
  otherUserName?: string
  otherUserEmail?: string
  activityType?: string
  city?: string
  shelfCity?: string
  mobileNumber?: string
  phoneNumber?: string
  email?: string
  website?: string
  commercialRegisterNumber?: string
  commercialRegisterFile?: string
  crNumber?: string
  crFile?: string
  shelfBranch?: string
  shelfName?: string
  startDate?: string
  endDate?: string
  rentalType?: string
  createdAt?: string
  _creationTime?: number
  additionalNotes?: string
  status: "pending" | "active" | "rejected" | "completed" | "expired"
  brandLogo?: string
  brandDescription?: string
  ownerName?: string
  socialMedia?: {
    instagram?: string
    twitter?: string
    snapchat?: string
    tiktok?: string
  }
}

interface RequestDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: RentalRequestDetails | null
}

export function RequestDetailsDialog({ open, onOpenChange, request: selectedRequest }: RequestDetailsDialogProps) {
  const { t, language } = useLanguage()
  const { user } = useCurrentUser()
  const [messageText, setMessageText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get the userId as a Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Chat mutations
  const sendMessage = useMutation(api.chats.sendMessage)
  const markAsRead = useMutation(api.chats.markMessagesAsRead)
  const getOrCreateConversation = useMutation(api.chats.getOrCreateConversation)
  
  // Request mutations
  const acceptRequest = useMutation(api.rentalRequests.acceptRentalRequest)
  const rejectRequest = useMutation(api.rentalRequests.rejectRentalRequest)

  // Fetch conversations for the selected request
  const conversations = useQuery(
    api.chats.getUserConversations,
    userId ? { userId } : "skip"
  )

  // Find conversation for this specific shelf and rental request
  const currentConversation = conversations?.find(
    c => selectedRequest && (
      c.shelfId === selectedRequest.shelfId &&
      (c.otherUserId === selectedRequest.otherUserId || 
       c.otherUserId === selectedRequest.brandOwnerId)
    )
  )

  // Fetch messages for the current conversation
  const messages = useQuery(
    api.chats.getMessages,
    currentConversation ? { conversationId: currentConversation._id } : "skip"
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (currentConversation && userId && open) {
      markAsRead({ conversationId: currentConversation._id })
    }
  }, [currentConversation, userId, open, markAsRead])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId || !selectedRequest) return

    try {
      let conversationId = currentConversation?._id

      // TODO: Fix conversation creation - need profile IDs, not user IDs
      // if (!conversationId) {
      //   conversationId = await getOrCreateConversation({
      //     brandProfileId: selectedRequest.brandOwnerId!,
      //     storeProfileId: selectedRequest.storeOwnerId!,
      //     shelfId: selectedRequest.shelfId,
      //   })
      // }

      // Send the message (only if we have a conversation)
      if (!conversationId) {
        throw new Error("No conversation available")
      }
      
      await sendMessage({
        conversationId: conversationId,
        senderId: userId,
        text: messageText,
      })
      setMessageText("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleAccept = async () => {
    if (!selectedRequest?._id || isProcessing) return
    setIsProcessing(true)
    try {
      await acceptRequest({ requestId: selectedRequest._id })
      onOpenChange(false) // Close dialog after accepting
    } catch (error) {
      console.error("Failed to accept request:", error)
      // Could add toast notification here for user feedback
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest?._id || isProcessing) return
    setIsProcessing(true)
    try {
      await rejectRequest({ requestId: selectedRequest._id })
      onOpenChange(false) // Close dialog after rejecting
    } catch (error) {
      console.error("Failed to reject request:", error)
      // Could add toast notification here for user feedback
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <DialogTitle className="text-lg sm:text-xl font-semibold break-words">
                {t("orders.request_details")}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-destructive flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{t("orders.cancel_warning")}</span>
              </div>
            </div>
            <Separator />
          </div>
        </DialogHeader>
        
        {selectedRequest && (
          <div className="space-y-6 mt-4">
            {/* Brand Info Header */}
            <div className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4">
              {selectedRequest.brandLogo ? (
                <img
                  src={selectedRequest.brandLogo}
                  alt={selectedRequest.otherUserName || "Brand"}
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-muted flex items-center justify-center border flex-shrink-0">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{selectedRequest.otherUserName || "-"}</h3>
                {selectedRequest.activityType && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {selectedRequest.activityType}
                  </p>
                )}
              </div>
            </div>

            {/* Brand Details Grid */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
              <div className="space-y-1 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("orders.owner_name")}</p>
                <p className="font-medium text-sm sm:text-base line-clamp-2">{selectedRequest.ownerName || "-"}</p>
              </div>
              <div className="space-y-1 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("orders.activity_type")}</p>
                <p className="font-medium text-sm sm:text-base line-clamp-2">{selectedRequest.activityType || "-"}</p>
              </div>
              <div className="space-y-1 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("orders.mobile_number")}</p>
                <p className="font-medium text-sm sm:text-base dir-ltr text-start">{selectedRequest.mobileNumber || selectedRequest.phoneNumber || "-"}</p>
              </div>
              <div className="space-y-1 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("orders.email")}</p>
                <p className="font-medium text-sm sm:text-base break-words">{selectedRequest.otherUserEmail || selectedRequest.email || "-"}</p>
              </div>
              <div className="space-y-1 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("orders.website")}</p>
                {selectedRequest.website ? (
                  <a
                    href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-1.5 py-1 sm:py-0"
                  >
                    <Globe className="h-3.5 w-3.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{t("common.visit")}</span>
                  </a>
                ) : (
                  <p className="font-medium text-sm sm:text-base">-</p>
                )}
              </div>
              <div className="space-y-1 p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("orders.commercial_register_number")}</p>
                <p className="font-medium text-sm sm:text-base">{selectedRequest.commercialRegisterNumber || selectedRequest.crNumber || "-"}</p>
              </div>
            </div>

            {/* Business Registration Document */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("orders.commercial_register")}</p>
              {selectedRequest.commercialRegisterFile || selectedRequest.crFile ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto min-h-[48px] sm:h-10 gap-2"
                  onClick={() => {
                    const fileUrl = selectedRequest.commercialRegisterFile || selectedRequest.crFile
                    if (fileUrl) {
                      window.open(fileUrl, '_blank')
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  {t("common.download")}
                </Button>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>

            <Separator />

            {/* Request Details */}
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("orders.request_details_title")}</h3>

              {/* Mobile Card Layout */}
              <div className="block md:hidden border rounded-lg overflow-hidden bg-muted/10">
                <div className="divide-y">
                  <div className="flex justify-between items-start gap-3 p-3">
                    <span className="text-sm text-muted-foreground flex-shrink-0">{t("orders.branch")}</span>
                    <span className="text-sm font-medium text-end">{selectedRequest.shelfBranch || "-"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 p-3">
                    <span className="text-sm text-muted-foreground flex-shrink-0">{t("orders.activity")}</span>
                    <span className="text-sm font-medium text-end">{selectedRequest.shelfName || "-"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 p-3">
                    <span className="text-sm text-muted-foreground flex-shrink-0">{t("orders.rental_duration")}</span>
                    <span className="text-sm font-medium text-end">
                      {selectedRequest.startDate && selectedRequest.endDate
                        ? formatDuration(selectedRequest.startDate, selectedRequest.endDate, language)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-3 p-3">
                    <span className="text-sm text-muted-foreground flex-shrink-0">{t("orders.rental_type")}</span>
                    <span className="text-sm font-medium text-end">{selectedRequest.rentalType || "-"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 p-3">
                    <span className="text-sm text-muted-foreground flex-shrink-0">{t("orders.rental_date")}</span>
                    <span className="text-sm font-medium text-end">
                      {selectedRequest.createdAt
                        ? formatDate(selectedRequest.createdAt, language, 'long')
                        : selectedRequest._creationTime
                        ? formatDate(new Date(selectedRequest._creationTime), language, 'long')
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-3 p-3">
                    <span className="text-sm text-muted-foreground flex-shrink-0">{t("orders.notes")}</span>
                    <span className="text-sm font-medium text-end break-words">
                      {selectedRequest.additionalNotes || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-start text-xs sm:text-sm whitespace-nowrap">{t("orders.branch")}</TableHead>
                        <TableHead className="text-start text-xs sm:text-sm whitespace-nowrap">{t("orders.activity")}</TableHead>
                        <TableHead className="text-start text-xs sm:text-sm whitespace-nowrap">{t("orders.rental_duration")}</TableHead>
                        <TableHead className="text-start text-xs sm:text-sm whitespace-nowrap">{t("orders.rental_type")}</TableHead>
                        <TableHead className="text-start text-xs sm:text-sm whitespace-nowrap">{t("orders.rental_date")}</TableHead>
                        <TableHead className="text-start text-xs sm:text-sm whitespace-nowrap">{t("orders.notes")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                          {selectedRequest.shelfBranch || "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{selectedRequest.shelfName || "-"}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {selectedRequest.startDate && selectedRequest.endDate
                            ? formatDuration(selectedRequest.startDate, selectedRequest.endDate, language)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{selectedRequest.rentalType || "-"}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {selectedRequest.createdAt
                            ? formatDate(selectedRequest.createdAt, language, 'long')
                            : selectedRequest._creationTime
                            ? formatDate(new Date(selectedRequest._creationTime), language, 'long')
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm max-w-[200px] truncate">
                          {selectedRequest.additionalNotes || "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-amber-800">
                {t("orders.agreement_confirmation")}
              </p>
            </div>

            {/* Communication Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-3 sm:p-4 bg-muted/30 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <h4 className="font-medium text-sm sm:text-base truncate">{t("orders.communication")}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0 max-w-[120px] truncate">
                    {selectedRequest?.otherUserName}
                  </Badge>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="h-[200px] sm:h-[300px] bg-background relative">
                {messages && messages.length > 0 ? (
                  <ScrollArea className="h-full p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      {messages.map((msg) => {
                        const isCurrentUser = msg.senderId === userId
                        const messageDate = new Date(msg.createdAt)

                        return (
                          <div
                            key={msg._id}
                            className={cn(
                              "flex gap-1.5 sm:gap-2",
                              isCurrentUser ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isCurrentUser && (
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {msg.senderName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                "max-w-[75%] sm:max-w-[60%] rounded-lg p-2 sm:p-3",
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
                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                              <p className={cn(
                                "text-[10px] sm:text-xs mt-1",
                                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {messageDate.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            {isCurrentUser && (
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {user?.fullName?.charAt(0).toUpperCase() || "S"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-full px-4">
                    <div className="flex flex-col items-center text-center">
                      <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("chat.no_messages_yet")}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {t("orders.start_conversation_description")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 sm:p-4 border-t bg-background">
                {selectedRequest.status === "rejected" ? (
                  <div className="text-center py-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("chat.conversation_closed")}
                    </p>
                  </div>
                ) : (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={t("chat.type_message_placeholder")}
                        className="flex-1 text-sm h-12 sm:h-10"
                        disabled={false} // TODO: Fix status type issue
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-12 w-12 sm:h-10 sm:w-10 flex-shrink-0"
                        disabled={!messageText.trim()} // TODO: Fix status type issue
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    {!currentConversation && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {t("orders.conversation_will_be_created")}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons - Only show for pending requests */}
            {selectedRequest.status === "pending" && (
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="gap-2 w-full sm:w-auto min-h-[48px]"
                >
                  <X className="h-4 w-4" />
                  {t("orders.reject")}
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="gap-2 w-full sm:w-auto min-h-[48px]"
                >
                  <Check className="h-4 w-4" />
                  {t("orders.accept")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
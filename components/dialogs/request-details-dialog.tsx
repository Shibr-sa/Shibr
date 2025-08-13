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
import { AlertTriangle, MessageSquare, Send, Download, Check, X } from "lucide-react"
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
  status: "pending" | "active" | "rejected"
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
      markAsRead({ conversationId: currentConversation._id, userId })
    }
  }, [currentConversation, userId, open, markAsRead])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId || !selectedRequest) return

    try {
      let conversationId = currentConversation?._id

      // If no conversation exists, create one
      if (!conversationId) {
        conversationId = await getOrCreateConversation({
          brandOwnerId: selectedRequest.brandOwnerId || selectedRequest.otherUserId,
          storeOwnerId: selectedRequest.storeOwnerId || userId,
          shelfId: selectedRequest.shelfId,
        })
      }

      // Send the message
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {t("orders.request_details")}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{t("orders.cancel_warning")}</span>
              </div>
            </div>
            <Separator />
          </div>
        </DialogHeader>
        
        {selectedRequest && (
          <div className="space-y-6 mt-4">
            {/* Request Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.renter_name")}</p>
                <p className="font-medium">{selectedRequest.otherUserName || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.activity_type")}</p>
                <p className="font-medium">{selectedRequest.activityType || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.city")}</p>
                <p className="font-medium">{selectedRequest.city || selectedRequest.shelfCity || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.mobile_number")}</p>
                <p className="font-medium">{selectedRequest.mobileNumber || selectedRequest.phoneNumber || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.email")}</p>
                <p className="font-medium">{selectedRequest.otherUserEmail || selectedRequest.email || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.website")}</p>
                <p className="font-medium">{selectedRequest.website || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.commercial_register_number")}</p>
                <p className="font-medium">{selectedRequest.commercialRegisterNumber || selectedRequest.crNumber || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.commercial_register")}</p>
                {selectedRequest.commercialRegisterFile || selectedRequest.crFile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2"
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
            </div>

            <Separator />

            {/* Request Details Table */}
            <div>
              <h3 className="font-semibold mb-4">{t("orders.request_details_title")}</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("orders.branch")}</TableHead>
                      <TableHead className="text-start">{t("orders.activity")}</TableHead>
                      <TableHead className="text-start">{t("orders.rental_duration")}</TableHead>
                      <TableHead className="text-start">{t("orders.rental_type")}</TableHead>
                      <TableHead className="text-start">{t("orders.rental_date")}</TableHead>
                      <TableHead className="text-start">{t("orders.notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        {selectedRequest.shelfBranch || "-"}
                      </TableCell>
                      <TableCell>{selectedRequest.shelfName || "-"}</TableCell>
                      <TableCell>
                        {selectedRequest.startDate && selectedRequest.endDate 
                          ? formatDuration(selectedRequest.startDate, selectedRequest.endDate, language)
                          : "-"}
                      </TableCell>
                      <TableCell>{selectedRequest.rentalType || "-"}</TableCell>
                      <TableCell>
                        {selectedRequest.createdAt 
                          ? formatDate(selectedRequest.createdAt, language, 'long')
                          : selectedRequest._creationTime
                          ? formatDate(new Date(selectedRequest._creationTime), language, 'long')
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {selectedRequest.additionalNotes || "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {t("orders.agreement_confirmation")}
              </p>
            </div>

            {/* Communication Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">{t("orders.communication")}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedRequest?.otherUserName}
                  </Badge>
                </div>
              </div>
              
              {/* Messages Area */}
              <ScrollArea className="h-[300px] p-4 bg-background">
                {messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => {
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
                              <AvatarFallback className="text-xs">
                                {msg.senderName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[60%] rounded-lg p-3",
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
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.text}
                            </p>
                            <p className={cn(
                              "text-xs mt-1",
                              isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {messageDate.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                          {isCurrentUser && (
                            <Avatar className="h-8 w-8">
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t("chat.no_messages_yet")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("orders.start_conversation_description")}
                    </p>
                  </div>
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t bg-background">
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
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {!currentConversation && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {t("orders.conversation_will_be_created")}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons - Only show for pending requests */}
            {selectedRequest.status === "pending" && (
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {t("orders.reject")}
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="gap-2"
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
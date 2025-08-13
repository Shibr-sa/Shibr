import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Create a new conversation for each rental request
export const getOrCreateConversation = mutation({
  args: {
    brandOwnerId: v.id("users"),
    storeOwnerId: v.id("users"),
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Always create a new conversation for each rental request
    // This ensures each rental request has its own conversation thread
    // Old conversations are archived when requests are rejected/expired
    
    const conversationId = await ctx.db.insert("conversations", {
      brandOwnerId: args.brandOwnerId,
      storeOwnerId: args.storeOwnerId,
      shelfId: args.shelfId,
      status: "active",
      brandOwnerUnreadCount: 0,
      storeOwnerUnreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return conversationId
  },
})


// Send a message in a conversation
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected"),
      v.literal("system")
    )),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error("Conversation not found")
    }
    
    // Prevent sending messages to archived conversations
    if (conversation.status === "archived") {
      throw new Error("This conversation has been closed")
    }

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      messageType: args.messageType || "text",
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    // Update conversation with last message info
    const isBrandOwner = args.senderId === conversation.brandOwnerId
    
    await ctx.db.patch(conversation._id, {
      lastMessageText: args.text,
      lastMessageTime: new Date().toISOString(),
      lastMessageSenderId: args.senderId,
      // Increment unread count for the recipient
      ...(isBrandOwner 
        ? { storeOwnerUnreadCount: conversation.storeOwnerUnreadCount + 1 }
        : { brandOwnerUnreadCount: conversation.brandOwnerUnreadCount + 1 }
      ),
      updatedAt: new Date().toISOString(),
    })

    // Create notification for recipient
    const recipientId = isBrandOwner ? conversation.storeOwnerId : conversation.brandOwnerId
    const sender = await ctx.db.get(args.senderId)
    
    await ctx.db.insert("notifications", {
      userId: recipientId,
      title: sender?.fullName || "New Message",
      message: args.text.substring(0, 100) + (args.text.length > 100 ? "..." : ""),
      type: "new_message",
      conversationId: args.conversationId,
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return messageId
  },
})

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect()

    // Get sender information for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId)
        return {
          ...message,
          senderName: sender?.fullName || sender?.storeName || sender?.brandName || "Unknown",
          senderType: sender?.accountType,
        }
      })
    )

    return messagesWithSenders
  },
})

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) return

    // Get unread messages sent by the other party
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation")
      .filter((q) => 
        q.and(
          q.eq(q.field("conversationId"), args.conversationId),
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), args.userId)
        )
      )
      .collect()

    // Mark them as read
    const now = new Date().toISOString()
    await Promise.all(
      messages.map((message) =>
        ctx.db.patch(message._id, {
          isRead: true,
          readAt: now,
        })
      )
    )

    // Reset unread count for this user
    const isBrandOwner = args.userId === conversation.brandOwnerId
    await ctx.db.patch(conversation._id, {
      ...(isBrandOwner 
        ? { brandOwnerUnreadCount: 0 }
        : { storeOwnerUnreadCount: 0 }
      ),
    })
  },
})

// Get conversations for a user
export const getUserConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user to check their account type
    const user = await ctx.db.get(args.userId)
    if (!user) return []

    // Query based on account type
    const conversations = await ctx.db
      .query("conversations")
      .withIndex(user.accountType === "brand-owner" ? "by_brand_owner" : "by_store_owner")
      .filter((q) => q.eq(q.field(user.accountType === "brand-owner" ? "brandOwnerId" : "storeOwnerId"), args.userId))
      .collect()

    // Get additional info for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = user.accountType === "brand-owner" ? conv.storeOwnerId : conv.brandOwnerId
        const otherUser = await ctx.db.get(otherUserId)
        const shelf = await ctx.db.get(conv.shelfId)

        return {
          ...conv,
          otherUserId: otherUserId,
          otherUserName: otherUser?.fullName || otherUser?.storeName || otherUser?.brandName || "Unknown",
          shelfName: shelf?.shelfName || "Unknown Shelf",
          unreadCount: user.accountType === "brand-owner" ? conv.brandOwnerUnreadCount : conv.storeOwnerUnreadCount,
        }
      })
    )

    // Sort by last message time
    return conversationsWithDetails.sort((a, b) => 
      (b.lastMessageTime || b.updatedAt).localeCompare(a.lastMessageTime || a.updatedAt)
    )
  },
})

// Get conversation details
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) return null

    const brandOwner = await ctx.db.get(conversation.brandOwnerId)
    const storeOwner = await ctx.db.get(conversation.storeOwnerId)
    const shelf = await ctx.db.get(conversation.shelfId)

    return {
      ...conversation,
      brandOwnerName: brandOwner?.fullName || brandOwner?.brandName || "Brand Owner",
      storeOwnerName: storeOwner?.fullName || storeOwner?.storeName || "Store Owner",
      shelfDetails: shelf,
    }
  },
})
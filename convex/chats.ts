import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Create a new conversation for each rental request
export const getOrCreateConversation = mutation({
  args: {
    brandProfileId: v.id("userProfiles"),
    storeProfileId: v.id("userProfiles"),
    shelfId: v.id("shelves"),
    rentalRequestId: v.optional(v.id("rentalRequests")), // Add optional rental request ID
  },
  handler: async (ctx, args) => {
    // Always create a new conversation for each rental request
    // This ensures each rental request has its own conversation thread
    // Old conversations are archived when requests are rejected/expired
    
    const conversationId = await ctx.db.insert("conversations", {
      brandProfileId: args.brandProfileId,
      storeProfileId: args.storeProfileId,
      shelfId: args.shelfId,
      rentalRequestId: args.rentalRequestId, // Store the rental request ID
      status: "active",
      brandUnreadCount: 0,
      storeUnreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return conversationId
  },
})


// Update conversation with rental request ID
export const updateConversationRentalRequest = mutation({
  args: {
    conversationId: v.id("conversations"),
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      rentalRequestId: args.rentalRequestId,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
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
    
    // Prevent sending messages to archived or rejected conversations
    if (conversation.status === "archived" || conversation.status === "rejected") {
      throw new Error("This conversation has been closed and new messages cannot be sent")
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
    // Get sender's profile to determine if they're brand or store
    const senderProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.senderId))
      .first()
    const isBrandOwner = senderProfile?._id === conversation.brandProfileId
    
    await ctx.db.patch(conversation._id, {
      lastMessageText: args.text,
      lastMessageTime: new Date().toISOString(),
      lastMessageSenderId: args.senderId,
      // Increment unread count for the recipient
      ...(isBrandOwner 
        ? { storeUnreadCount: (conversation.storeUnreadCount || 0) + 1 }
        : { brandUnreadCount: (conversation.brandUnreadCount || 0) + 1 }
      ),
      updatedAt: new Date().toISOString(),
    })

    // Create notification for recipient
    // Get the recipient user ID from profile
    const recipientProfileId = isBrandOwner ? conversation.storeProfileId : conversation.brandProfileId
    const recipientProfile = recipientProfileId ? await ctx.db.get(recipientProfileId) : null
    const recipientId = recipientProfile?.userId
    
    if (recipientId) {
      await ctx.db.insert("notifications", {
        userId: recipientId,
        title: "New Message", // Simplified - fullName removed from userProfiles
      message: args.text.substring(0, 100) + (args.text.length > 100 ? "..." : ""),
      type: "new_message",
        conversationId: args.conversationId,
        rentalRequestId: conversation.rentalRequestId, // Add the rental request ID if exists
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }

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

    // Get sender information for each message and convert attachments
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId)
        const senderProfile = sender ? await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", message.senderId))
          .first() : null
        
        // Convert attachment storage ID to URL if exists
        let attachmentUrl = null
        if (message.attachment) {
          attachmentUrl = await ctx.storage.getUrl(message.attachment)
        }
        
        return {
          ...message,
          attachmentUrl,
          senderName: senderProfile?.storeName || senderProfile?.brandName || "Unknown",
          senderType: senderProfile?.accountType,
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
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
          q.neq(q.field("senderId"), userId)
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
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    const isBrandOwner = userProfile?._id === conversation.brandProfileId
    await ctx.db.patch(conversation._id, {
      ...(isBrandOwner 
        ? { brandUnreadCount: 0 }
        : { storeUnreadCount: 0 }
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
    // Get user profile to check their account type
    const user = await ctx.db.get(args.userId)
    if (!user) return []
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    if (!userProfile) return []

    // Query based on account type using profile IDs
    const conversations = await ctx.db
      .query("conversations")
      .withIndex(userProfile.accountType === "brand_owner" ? "by_brand_profile" : "by_store_profile")
      .filter((q) => q.eq(q.field(userProfile.accountType === "brand_owner" ? "brandProfileId" : "storeProfileId"), userProfile._id))
      .collect()

    // Get additional info for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherProfileId = userProfile.accountType === "brand_owner" ? conv.storeProfileId : conv.brandProfileId
        const otherUserProfile = otherProfileId ? await ctx.db.get(otherProfileId) : null
        const otherUser = otherUserProfile ? await ctx.db.get(otherUserProfile.userId) : null
        const otherUserId = otherUser?._id
        const shelf = await ctx.db.get(conv.shelfId)

        return {
          ...conv,
          otherUserId: otherUserId,
          otherUserName: otherUserProfile?.storeName || otherUserProfile?.brandName || "Unknown",
          shelfName: shelf?.shelfName || "Unknown Shelf",
          unreadCount: userProfile.accountType === "brand_owner" ? (conv.brandUnreadCount || 0) : (conv.storeUnreadCount || 0),
        }
      })
    )

    // Sort by last message time
    return conversationsWithDetails.sort((a, b) => 
      (b.lastMessageTime || b.updatedAt).localeCompare(a.lastMessageTime || a.updatedAt)
    )
  },
})

// Get admin conversations only (for store owners)
export const getAdminConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user profile to check their account type
    const user = await ctx.db.get(args.userId)
    if (!user) return []
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    if (!userProfile || userProfile.accountType !== "store_owner") return []

    // Get all user profiles to find admin users
    const adminProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_account_type", (q) => q.eq("accountType", "admin"))
      .collect()
    const adminUserIds = adminProfiles.map(p => p.userId)

    // Get conversations where the other party is an admin
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_store_profile")
      .filter((q) => q.eq(q.field("storeProfileId"), userProfile._id))
      .collect()

    // Filter for admin conversations only
    const adminConversations = await Promise.all(
      conversations.map(async (conv) => {
        const brandProfile = conv.brandProfileId ? await ctx.db.get(conv.brandProfileId) : null
        if (brandProfile && adminUserIds.includes(brandProfile.userId)) {
          return conv
        }
        return null
      })
    )
    const filteredAdminConversations = adminConversations.filter(Boolean) as typeof conversations

    // Get additional info for each conversation
    const conversationsWithDetails = await Promise.all(
      filteredAdminConversations.map(async (conv) => {
        const adminProfile = conv.brandProfileId ? await ctx.db.get(conv.brandProfileId) : null
        const adminUser = adminProfile ? await ctx.db.get(adminProfile.userId) : null
        const shelf = await ctx.db.get(conv.shelfId)

        return {
          ...conv,
          otherUserId: adminUser?._id,
          otherUserName: "Admin Support",
          shelfName: shelf?.shelfName || "Support",
          unreadCount: conv.storeUnreadCount || 0,
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

    const brandOwnerProfile = conversation.brandProfileId ? await ctx.db.get(conversation.brandProfileId) : null
    const brandOwner = brandOwnerProfile ? await ctx.db.get(brandOwnerProfile.userId) : null
    const storeOwnerProfile = conversation.storeProfileId ? await ctx.db.get(conversation.storeProfileId) : null
    const storeOwner = storeOwnerProfile ? await ctx.db.get(storeOwnerProfile.userId) : null
    const shelf = await ctx.db.get(conversation.shelfId)

    return {
      ...conversation,
      brandOwnerName: brandOwnerProfile?.brandName || "Brand Owner",
      storeOwnerName: storeOwnerProfile?.storeName || "Store Owner",
      shelfDetails: shelf,
    }
  },
})
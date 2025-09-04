import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"

// Create a new conversation for each rental request
export const getOrCreateConversation = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    storeProfileId: v.id("storeProfiles"),
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Always create a new conversation for each rental request
    // This ensures each rental request has its own conversation thread
    // Old conversations are archived when requests are rejected/expired
    
    const conversationId = await ctx.db.insert("conversations", {
      brandProfileId: args.brandProfileId,
      storeProfileId: args.storeProfileId,
      shelfId: args.shelfId,
      status: "active",
      brandUnreadCount: 0,
      storeUnreadCount: 0,
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
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected")
    )),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error("Conversation not found")
    }
    
    // Prevent sending messages to archived or rejected conversations
    if (conversation.status === "archived") {
      throw new Error("This conversation has been closed and new messages cannot be sent")
    }

    // Get sender's profile to determine sender type
    const senderProfileData = await getUserProfile(ctx, args.senderId)
    const senderType = senderProfileData?.type === "brand_owner" ? "brand" : 
                      senderProfileData?.type === "store_owner" ? "store" : "system"
    const senderProfileId = senderProfileData?.profile._id

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderType: senderType as "brand" | "store" | "system",
      senderId: senderProfileId as any,
      text: args.text,
      messageType: args.messageType || "text",
      isRead: false,
    })

    // Update conversation with last message info
    // System messages should increment both unread counts
    // Brand messages increment store's unread count
    // Store messages increment brand's unread count
    const isBrandOwner = senderProfileData?.type === "brand_owner" && 
                          senderProfileData?.profile._id === conversation.brandProfileId
    const isStoreOwner = senderProfileData?.type === "store_owner" && 
                         senderProfileData?.profile._id === conversation.storeProfileId
    const isSystem = senderType === "system"
    
    await ctx.db.patch(conversation._id, {
      // Increment unread count for the recipient(s)
      ...(isSystem 
        ? { 
            // System messages are unread for both parties
            storeUnreadCount: (conversation.storeUnreadCount || 0) + 1,
            brandUnreadCount: (conversation.brandUnreadCount || 0) + 1
          }
        : isBrandOwner 
        ? { storeUnreadCount: (conversation.storeUnreadCount || 0) + 1 }
        : isStoreOwner
        ? { brandUnreadCount: (conversation.brandUnreadCount || 0) + 1 }
        : {}
      ),
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
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    // Get sender information for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        // Get sender profile based on senderType and senderId
        let senderName: string | undefined
        if (message.senderType === "brand") {
          const brandProfile = await ctx.db.get(message.senderId as any)
          senderName = (brandProfile as any)?.brandName
        } else if (message.senderType === "store") {
          const storeProfile = await ctx.db.get(message.senderId as any)
          senderName = (storeProfile as any)?.storeName
        } else if (message.senderType === "system") {
          senderName = "System"
        }
        
        return {
          ...message,
          senderName,
        }
      })
    )

    return messagesWithSenders
  },
})

// Internal helper to send system messages with proper unread count handling
export const sendSystemMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.union(
      v.id("brandProfiles"),
      v.id("storeProfiles")
    ), // Profile ID of the sender (for context)
    text: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected")
    ),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error("Conversation not found")
    }
    
    // Create the system message - messageType should be one of the existing types
    // System messages are identified by senderType: "system", not by messageType
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderType: "system" as const,
      senderId: args.senderId,
      text: args.text,
      messageType: args.messageType as "text" | "rental_request" | "rental_accepted" | "rental_rejected",
      isRead: false,
    })

    // System messages increment both parties' unread counts
    await ctx.db.patch(conversation._id, {
      storeUnreadCount: (conversation.storeUnreadCount || 0) + 1,
      brandUnreadCount: (conversation.brandUnreadCount || 0) + 1,
    })

    return messageId
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

    const userProfileData = await getUserProfile(ctx, userId)
    if (!userProfileData) return

    // Get unread messages not sent by this user's profile
    const userProfileId = userProfileData.profile._id
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), userProfileId as any)
        )
      )
      .collect()

    // Mark them as read
    await Promise.all(
      messages.map((message) =>
        ctx.db.patch(message._id, {
          isRead: true,
        })
      )
    )

    // Reset unread count for this user
    const isBrandOwner = userProfileData?.type === "brand_owner" && 
                          userProfileData?.profile._id === conversation.brandProfileId
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
    
    const userProfileData = await getUserProfile(ctx, args.userId)
    if (!userProfileData) return []

    // Query based on account type using profile IDs
    const conversations = await ctx.db
      .query("conversations")
      .withIndex(userProfileData.type === "brand_owner" ? "by_brand_profile" : "by_store_profile")
      .filter((q) => q.eq(q.field(userProfileData.type === "brand_owner" ? "brandProfileId" : "storeProfileId"), userProfileData.profile._id))
      .collect()

    // Get additional info for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherProfileId = userProfileData.type === "brand_owner" ? conv.storeProfileId : conv.brandProfileId
        const otherUserProfile = otherProfileId ? await ctx.db.get(otherProfileId) : null
        const otherUser = otherUserProfile ? await ctx.db.get(otherUserProfile.userId) : null
        const otherUserId = otherUser?._id
        const shelf = await ctx.db.get(conv.shelfId)

        return {
          ...conv,
          otherUserId: otherUserId,
          otherUserName: otherUserProfile ? 
            ((otherUserProfile as any).storeName || (otherUserProfile as any).brandName) : undefined,
          shelfName: shelf?.shelfName,
          unreadCount: userProfileData.type === "brand_owner" ? (conv.brandUnreadCount || 0) : (conv.storeUnreadCount || 0),
        }
      })
    )

    // Sort by creation time (newest first)
    return conversationsWithDetails.sort((a, b) => 
      b._creationTime - a._creationTime
    )
  },
})

// Get unread message counts for user
export const getUnreadMessageCounts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userProfileData = await getUserProfile(ctx, args.userId)
    if (!userProfileData) return { total: 0, byConversation: {} }

    // Get all conversations for this user
    const conversations = await ctx.db
      .query("conversations")
      .withIndex(userProfileData.type === "brand_owner" ? "by_brand_profile" : "by_store_profile")
      .filter((q) => q.eq(
        q.field(userProfileData.type === "brand_owner" ? "brandProfileId" : "storeProfileId"), 
        userProfileData.profile._id
      ))
      .collect()

    // Calculate total and per-conversation counts
    const byConversation: Record<string, number> = {}
    let total = 0

    for (const conv of conversations) {
      const unreadCount = userProfileData.type === "brand_owner" 
        ? (conv.brandUnreadCount || 0) 
        : (conv.storeUnreadCount || 0)
      
      if (unreadCount > 0) {
        byConversation[conv._id] = unreadCount
        total += unreadCount
      }
    }

    return { total, byConversation }
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
      brandOwnerName: brandOwnerProfile?.brandName,
      storeOwnerName: storeOwnerProfile?.storeName,
      shelfDetails: shelf,
    }
  },
})
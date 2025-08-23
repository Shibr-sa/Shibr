import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Get user notifications
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    excludeMessageNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    const limit = args.limit || 50
    
    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .take(limit)

    // Filter out new_message notifications if requested
    if (args.excludeMessageNotifications) {
      notifications = notifications.filter(n => n.type !== "new_message")
    }

    return notifications
  },
})

// Get unread notification count
export const getUnreadCount = query({
  args: {
    excludeMessageNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }
    
    let unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect()

    // Filter out new_message notifications if requested
    if (args.excludeMessageNotifications) {
      unreadNotifications = unreadNotifications.filter(n => n.type !== "new_message")
    }

    return unreadNotifications.length
  },
})

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: new Date().toISOString(),
    })
  },
})

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect()

    const now = new Date().toISOString()
    
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
          readAt: now,
        })
      )
    )

    return unreadNotifications.length
  },
})

// Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId)
  },
})

// Get unread count for specific rental requests (including all notification types)
export const getUnreadCountByRentalRequests = query({
  args: {
    rentalRequestIds: v.array(v.id("rentalRequests")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {};
    }
    
    const unreadCounts: Record<string, number> = {}
    
    for (const rentalRequestId of args.rentalRequestIds) {
      // Get ALL unread notifications for this rental request (including messages)
      const unread = await ctx.db
        .query("notifications")
        .withIndex("by_user")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("rentalRequestId"), rentalRequestId),
            q.eq(q.field("isRead"), false)
          )
        )
        .collect()
      
      unreadCounts[rentalRequestId] = unread.length
    }
    
    return unreadCounts
  },
})

// Get total unread count for orders page (all notification types for store owner)
export const getTotalOrderNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }
    
    // Get all unread notifications for the user that are related to rental requests
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect()
    
    // Filter to only include notifications that have a rentalRequestId
    const orderRelatedNotifications = unread.filter(n => n.rentalRequestId)
    
    return orderRelatedNotifications.length
  },
})

// Mark all notifications for a rental request as read (including messages)
export const markRentalRequestNotificationsAsRead = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get ALL unread notifications for this rental request (including new_message type)
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("rentalRequestId"), args.rentalRequestId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect()

    const now = new Date().toISOString()
    
    // Mark all notifications as read
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
          readAt: now,
        })
      )
    )

    return unreadNotifications.length
  },
})

// Clear old notifications (older than 30 days)
export const clearOldNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.lt(q.field("createdAt"), thirtyDaysAgo)
        )
      )
      .collect()

    await Promise.all(
      oldNotifications.map((notification) =>
        ctx.db.delete(notification._id)
      )
    )

    return oldNotifications.length
  },
})
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get user notifications
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    excludeMessageNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50
    
    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => q.eq(q.field("userId"), args.userId))
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
    userId: v.id("users"),
    excludeMessageNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
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
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
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

// Clear old notifications (older than 30 days)
export const clearOldNotifications = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
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
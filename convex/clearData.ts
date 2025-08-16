import { mutation } from "./_generated/server";

export const clearAllData = mutation({
  handler: async (ctx) => {
    // Delete all users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    
    // Delete all shelves
    const shelves = await ctx.db.query("shelves").collect();
    for (const shelf of shelves) {
      await ctx.db.delete(shelf._id);
    }
    
    // Delete all products
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    
    // Delete all rental requests
    const rentalRequests = await ctx.db.query("rentalRequests").collect();
    for (const request of rentalRequests) {
      await ctx.db.delete(request._id);
    }
    
    // Delete all conversations
    const conversations = await ctx.db.query("conversations").collect();
    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }
    
    return { message: "All data cleared successfully" };
  },
});
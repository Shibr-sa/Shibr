import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

try {
  // Get all users first
  const users = await client.query(api.users.getAllUsers);
  console.log("Users found:", users.length);
  
  if (users.length > 0) {
    const userId = users[0]._id;
    console.log("Using user ID:", userId);
    
    // Get shelves for this user
    const shelves = await client.query(api.shelves.getOwnerShelves, { ownerId: userId });
    console.log("Shelves found:", shelves.length);
    
    if (shelves.length > 0) {
      console.log("First shelf ID:", shelves[0]._id);
      console.log("First shelf name:", shelves[0].shelfName);
    } else {
      console.log("No shelves found. Adding a test shelf...");
      
      // Add a test shelf
      const shelfId = await client.mutation(api.shelves.addShelf, {
        userId: userId,
        shelfName: "رف اختباري A1",
        city: "الرياض",
        branch: "فرع حي النرجس",
        monthlyPrice: 1500,
        discountPercentage: 10,
        availableFrom: "2024-01-01",
        length: "1.5",
        width: "1.2",
        depth: "3",
        productType: "الإلكترونيات",
        description: "مساحة رف مميزة في منطقة عالية الحركة",
        address: "شارع الملك فهد، الرياض"
      });
      
      console.log("Successfully added shelf with ID:", shelfId);
    }
  }
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}

process.exit(0);

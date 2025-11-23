import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Run daily to check rental statuses (changed from hourly to avoid configuration issues)
crons.daily(
  "check rental statuses",
  { hourUTC: 0, minuteUTC: 0 }, // Run at midnight UTC
  internal.rentalManagement.checkRentalStatuses
)

// Run daily to send reminder notifications
crons.daily(
  "send rental reminders",
  { hourUTC: 9, minuteUTC: 0 }, // Run at 9 AM UTC (12 PM Saudi time)
  internal.rentalManagement.sendRentalReminders
)

// Run daily to process pending clearances (B4.1)
crons.daily(
  "process clearances",
  { hourUTC: 10, minuteUTC: 0 }, // Run at 10 AM UTC (1 PM Saudi time)
  internal.rentalClearance.processPendingClearances
)

export default crons
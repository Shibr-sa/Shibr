import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Run every hour to check rental statuses
crons.hourly(
  "check rental statuses",
  { hourOfDay: 0, minuteOfHour: 0 }, // Run at midnight every day
  internal.rentalManagement.checkRentalStatuses
)

// Run daily to send reminder notifications
crons.daily(
  "send rental reminders",
  { hourUTC: 9, minuteUTC: 0 }, // Run at 9 AM UTC (12 PM Saudi time)
  internal.rentalManagement.sendRentalReminders
)

export default crons
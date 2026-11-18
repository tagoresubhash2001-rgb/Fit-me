export { healthCheck } from './health';
export { coachChat } from './ai/coach';
export { analyzeFoodText } from './ai/foodText';
export { deleteAccount } from './account/deleteAccount';
export { exportData } from './account/exportData';
export { startTrial, manageSubscription } from './billing/subscription';
export { revenuecatWebhook, cashfreeWebhook } from './billing/webhooks';
import { trialReminders } from './billing/reminders';

// Scheduled functions need the deploy account to manage Cloud Scheduler jobs. The deploy workflow sets
// SCHEDULED_FUNCTIONS=off until the owner grants that role (docs/DEPLOY.md, "Scheduled functions").
if (process.env.SCHEDULED_FUNCTIONS !== 'off') exports.trialReminders = trialReminders;

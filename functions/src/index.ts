export { healthCheck } from './health';
export { coachChat } from './ai/coach';
export { analyzeFoodText } from './ai/foodText';
export { analyzeFoodPhoto } from './ai/foodPhoto';
export { deleteAccount } from './account/deleteAccount';
export { exportData } from './account/exportData';
export { searchFoods } from './foods/searchFunction';
export { onUserCreated, getAccess } from './account/access';
export { startTrial, manageSubscription } from './billing/subscription';
export { revenuecatWebhook, cashfreeWebhook } from './billing/webhooks';
import { trialReminders } from './billing/reminders';

// Scheduled functions need the deploy account to manage Cloud Scheduler jobs. The deploy workflow sets
// SCHEDULED_FUNCTIONS=off until the owner grants that role (docs/DEPLOY.md, "Scheduled functions").
if (process.env.SCHEDULED_FUNCTIONS !== 'off') exports.trialReminders = trialReminders;
export { submitTestimonial, withdrawTestimonial, reviewTestimonial } from './testimonials/testimonials';
export {
  adminOverview,
  adminListUsers,
  adminGetUser,
  adminSetUserDisabled,
  adminSetRole,
  adminRevokeMySessions,
  adminSavePricing,
  adminSavePlans,
  adminSaveFeatures,
  adminSaveContent,
  adminSaveAppSettings,
  adminSaveAccess,
  adminSaveFood,
  adminReviewFoodSuggestion,
  reportAiFood,
} from './admin/admin';
export { adminAction } from './admin/control';
export { memberAction } from './member/member';
export { wearablesStatus, wearablesConnect, wearablesDisconnect, wearablesSync } from './wearables/openWearables';

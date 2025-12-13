// Client-side exports only
export { createClient } from "./client";

// Auth (client-side)
export {
  signUp,
  signIn,
  signOut,
  getSession,
  getUser,
  resetPassword,
  updatePassword,
  signInWithPhone,
  verifyPhoneOtp,
  type AuthError,
  type AuthResult,
} from "./auth";

// Reports (client-side)
export {
  getReportsWithinRadius,
  getActiveReports,
  getReportById,
  createReport,
  addReportInteraction,
  subscribeToReports,
  type CreateReportInput,
  type InteractionType,
} from "./reports";

// Storage (client-side)
export {
  uploadReportImage,
  uploadReportImageFromDataUrl,
  deleteReportImage,
  compressImage,
} from "./storage";

// Emergency Contacts (client-side)
export {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getAlertConfig,
  saveAlertConfig,
  type EmergencyContact,
  type AlertConfig,
  type CreateContactInput,
} from "./emergency-contacts";

// Note: Server-side functions (createServerClient, createServiceClient)
// should be imported directly from "./server" in server components only

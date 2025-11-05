// AI Services Integration
// This file ensures all AI services are properly initialized

import { backgroundAIService } from './backgroundAI';
import { autoApprovalAI } from './autoApproval';
import { aiActivityLogger } from './aiActivityLogger';
import { realtimeAI } from './realtimeAI';

// Export all AI services
export { backgroundAIService, autoApprovalAI, aiActivityLogger, realtimeAI };

// Initialize AI services when this module is imported
// The background service will NOT auto-start when imported
// It will only start when explicitly called from authenticated admin contexts
// This prevents permission errors when user is not authenticated

// Also ensure realtime AI is enabled by default
realtimeAI.setAIMode(true);

// IMPORTANT: Background AI service is disabled by default
// It will only start when explicitly called from admin page

export default {
  backgroundAIService,
  autoApprovalAI,
  aiActivityLogger,
  realtimeAI
};

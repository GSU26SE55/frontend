// Toast messages SHARED cross-feature (shared/hooks, shared/components) plus
// messages repeated across several features (KB refs, mic permission). One source.
// Toasts specific to a single feature → features/<feature>/constants/messages.ts.

export const MESSAGES = {
  // Generic errors
  unknownError: "Something went wrong",
  micPermission: "Can't access the microphone. Grant permission and try again.",

  // KB references (used by both staff and manager)
  kb: {
    refAttached: "KB article attached",
    refDetached: "KB article detached",
  },

  // Ticket chat (shared/hooks/useTicketChatActions)
  chat: {
    commentDeleted: "Comment deleted",
    fileScanning: "File is being scanned for viruses, try again in a moment.",
    fileInfected: "File is infected — download blocked.",
    voiceRetryQueued: "Retrying voice transcription...",
  },

  // Alerts / environment (shared/hooks)
  alert: {
    acknowledged: "Alert acknowledged",
    resolved: "Alert resolved",
  },
  incident: {
    acknowledged: "Incident acknowledged",
    resolved: "Incident resolved",
    falseAlarm: "Marked as false alarm",
    reported: "Incident reported",
    // Dedup: the BE returns 200 with the existing incident when the site already
    // has an active incident of the same type.
    alreadyActive:
      "This site already has an open incident of the same type — showing that one",
  },
  ambient: {
    thresholdSaved: "Environmental threshold settings saved",
  },
  classification: {
    feedbackSubmitted: "Feedback recorded",
  },

  // Device / calibration / notification (shared/components)
  device: {
    registered: "Device registered",
    unregistered: "Device unregistered",
  },
  calibration: {
    added: "Calibration added",
    deleted: "Calibration deleted",
  },
  notificationPrefs: {
    saved: "Notification settings saved",
    matrixSaved: "Per-group preferences saved",
    matrixNoChange: "No changes to save",
    matrixSaveFailed: "Couldn't save per-group preferences",
  },
  file: {
    loadInfoFailed: "Failed to load file details.",
  },
} as const;

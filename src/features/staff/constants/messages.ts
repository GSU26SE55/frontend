// Toast messages specific to the staff feature. Shared toasts → shared/constants/messages.

export const STAFF_MESSAGES = {
  kb: {
    created: "KB article created (awaiting approval)",
    updated: "Article updated",
    updatePending: "Changes submitted — awaiting approval to go live",
    duplicated: "Article duplicated — open the copy to edit it",
    markedHelpful: "Marked as helpful",
  },
  ticket: {
    commentAdded: "Comment added",
    maintenanceLogAdded: "Maintenance log added",
    maintenanceLogUpdated: "Maintenance log updated",
  },
} as const;

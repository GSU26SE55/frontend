// Toast messages specific to the manager feature. Shared toasts → shared/constants/messages.

export const MANAGER_MESSAGES = {
  ticket: {
    triaged: "Ticket triaged",
    rejectedAtTriage: "Ticket rejected at triage",
    staffAssigned: "Staff assigned",
    staffReassigned: "Staff reassigned",
    resultApproved: "Resolution approved",
    resultRejected: "Resolution rejected — ticket back to In Progress",
    escalated: "Ticket escalated",
    markedIncident: "Ticket marked as Incident",
    commentAdded: "Comment added",
    reprioritized: "Ticket priority changed",
    // The BE escalates automatically when the new priority exceeds the tier of the Staff handling it.
    reprioritizedWithEscalation:
      "Priority changed — auto-escalated because the current Staff isn't high enough tier",
  },
  kb: {
    created: "KB article created",
    updated: "Article updated",
    updatePending: "Changes submitted — awaiting approval to go live",
    duplicated: "Article duplicated — open the copy to edit it",
    markedHelpful: "Marked as helpful",
  },
} as const;

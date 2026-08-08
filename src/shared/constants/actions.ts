// Action labels (button/menu) shared across the whole app. Kept in one place so:
// - Wording stays consistent everywhere.
// - Changing a label once applies it everywhere.
// Usage: <Button>{ACTIONS.SAVE}</Button>

export const ACTIONS = {
  SAVE: "Save",
  SAVE_CHANGES: "Save changes",
  DELETE: "Delete",
  CANCEL: "Cancel",
  CONFIRM: "Confirm",
  ADD: "Add",
  ADD_NEW: "Add new",
  EDIT: "Edit",
  CREATE: "Create",
  CLOSE: "Close",
  BACK: "Back",
  REJECT: "Reject",
  APPROVE: "Approve",
  REFRESH: "Refresh",
  SEND: "Send",
  UPDATE: "Update",
} as const;

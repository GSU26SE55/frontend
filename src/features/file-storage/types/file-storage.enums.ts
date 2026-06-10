export const FilePurposeEnum = {
  Other: 0,
  Avatar: 1,
  TicketAttachment: 2,
  MaintenancePhoto: 3,
  KbImage: 4,
  Firmware: 5,
} as const;
export type FilePurposeEnum =
  (typeof FilePurposeEnum)[keyof typeof FilePurposeEnum];

export const FileStatusEnum = {
  Uploaded: 0,
  Processing: 1,
  Ready: 2,
  Quarantined: 3,
  Deleted: 4,
} as const;
export type FileStatusEnum =
  (typeof FileStatusEnum)[keyof typeof FileStatusEnum];

/** Role names, the same strings as MMS.Play.Contracts.Authorization.Roles. */
export const Roles = {
  /** Manages scores (upload, delete), sees the jobs dashboard. */
  Admin: 'Admin',
  /** Browses and plays scores, read only. */
  Student: 'Student',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

/** Every role that may use the app; an account with none of them waits for approval. */
export const APP_ROLES: readonly Role[] = [Roles.Admin, Roles.Student];

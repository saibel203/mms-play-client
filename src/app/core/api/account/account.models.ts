/** Transport models of /api/v1/account, mirroring MMS.Play.Contracts.Models.Identity. */

/** The signed-in user (CurrentUserDto). */
export interface CurrentUserDto {
  id: string;
  userName: string;
  /** Admin and/or Student; empty for an account that has not been approved yet. */
  roles: string[];
}

export interface LoginRequest {
  /** Case insensitive. */
  userName: string;
  password: string;
  /** Persistent cookie (14 days, sliding); otherwise it ends with the browser session. */
  rememberMe: boolean;
}

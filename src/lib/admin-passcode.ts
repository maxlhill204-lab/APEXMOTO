export const ADMIN_PASSCODE_PATTERN = /^\d{6}$/;

export function isValidAdminPasscode(value: string | undefined | null) {
  return ADMIN_PASSCODE_PATTERN.test(value?.trim() ?? "");
}

export const INVITE_STORAGE_KEY = 'water-quest-invite-v1';

export function normalizeInviteCode(value) {
  return String(value || '').trim();
}

export function isInviteCodePresent(value) {
  return normalizeInviteCode(value).length >= 4;
}

/** Fired when `localStorage` user (or auth) is mutated outside React state (e.g. axios 401). Same-tab listeners refresh session user. */
export const USER_STORAGE_SYNC_EVENT = 'smartur:user-storage-sync';

export function emitUserStorageSync(): void {
    window.dispatchEvent(new Event(USER_STORAGE_SYNC_EVENT));
}

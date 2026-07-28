/**
 * Timing constants shared by both apps.
 *
 * These live here rather than in the server so the UI can describe the same
 * thresholds it is rendering ("idle for over 30s") without hardcoding a second
 * copy that can drift from the server's actual behaviour.
 */

/** Input seen within this window means the patient is `typing`. */
export const TYPING_WINDOW_MS = 4_000;

/** Silent for longer than this while still connected means `idle`. */
export const IDLE_AFTER_MS = 30_000;

/** How often the server re-evaluates every session's derived status. */
export const STATUS_TICK_MS = 1_000;

/** Lobby summaries are throttled to this interval per session. */
export const LOBBY_THROTTLE_MS = 1_500;

/** Free-text fields debounce their patches by this much on the client. */
export const PATCH_DEBOUNCE_MS = 300;

/** Sessions with no input at all are dropped after this long. */
export const ABANDONED_CLEANUP_MS = 5 * 60_000;

/** Submitted sessions stay visible to staff this long before being dropped. */
export const SUBMITTED_RETENTION_MS = 10 * 60_000;

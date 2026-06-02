import { timingSafeEqual } from "crypto";

export const GITHUB_STATE_COOKIE = "__gh_state";

/**
 * Compares the state value echoed back by GitHub against the one stored
 * in the user's cookie using a timing-safe comparison.
 *
 * Returns false when either value is missing — this is the correct
 * behaviour: a missing cookie means the install was not initiated through
 * our /install endpoint and should be rejected.
 */
export function isValidState(
  callbackState: string | null | undefined,
  cookieState: string | null | undefined,
): boolean {
  if (!callbackState || !cookieState) return false;

  // Lengths must match before we can use timingSafeEqual
  if (callbackState.length !== cookieState.length) return false;

  return timingSafeEqual(
    Buffer.from(callbackState),
    Buffer.from(cookieState),
  );
}

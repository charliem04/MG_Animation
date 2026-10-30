/**
 * ════════════════════════════════════════════════════════════════════
 *  FORM SAFETY — what the brief form lets in, and how often it sends.
 *
 *  Used in two places: as the visitor types (components/signal/
 *  SignalContact.tsx), and again just before sending
 *  (lib/submitContact.ts), so nothing that skipped the first pass
 *  gets through the second.
 *
 *  ── WHAT THIS IS AND ISN'T ──────────────────────────────────────────
 *
 *  The form posts from the browser straight to Web3Forms. Everything
 *  here runs in the browser, so it keeps the email Matt receives clean
 *  and stops someone hammering the Send button, but a bot that posts
 *  to Web3Forms directly never runs this code. Web3Forms' own spam
 *  filtering (their dashboard) is what covers that case.
 * ════════════════════════════════════════════════════════════════════
 */

/** Longest value each field accepts. */
export const LIMITS = {
  name: 80,
  email: 254, // the longest an email address can be
  phone: 20, // "+1 (337) 519-8025 x12" fits; a paragraph doesn't
  neededByCustom: 80,
  message: 2000,
} as const;

/**
 * Characters nobody types on purpose: control codes (except tab and
 * newline, handled per field), zero-width characters, text-direction
 * overrides and byte-order marks. These are the ones used to hide or
 * reorder text in an email.
 */
// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/**
 * Characters used for markup, templates and shell commands:
 * < > ` { } | \  and a $ that starts $( … ). None of them is needed to
 * describe a video project, and "$5k" still gets through.
 */
const COMMAND = /[<>`{}|\\]|\$(?=\()/g;

/** Spreadsheet formula starters, removed from the start of short fields. */
const FORMULA_START = /^[=+\-@\s]+/;

/**
 * Clean text as it's typed. Keeps what the visitor meant, drops the
 * rest, and stops at the field's limit. Doesn't trim, so typing a
 * space between words still works.
 */
export function cleanTyping(value: string, max: number, multiline = false): string {
  let v = value.normalize("NFC").replace(INVISIBLE, "").replace(COMMAND, "");
  v = multiline ? v.replace(/\r\n?/g, "\n").replace(/\t/g, " ") : v.replace(/[\t\r\n]+/g, " ");
  return v.slice(0, max);
}

/** Final pass before sending: clean, trim and squeeze the spacing. */
export function cleanFinal(value: string, max: number, multiline = false): string {
  let v = cleanTyping(value, max * 2, multiline);
  v = multiline
    ? v
        .split("\n")
        .map((line) => line.replace(/ {2,}/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
    : v.replace(/\s+/g, " ");
  return v.trim().slice(0, max);
}

/** Final pass for one-line fields that could end up in a spreadsheet. */
export function cleanShort(value: string, max: number): string {
  return cleanFinal(value, max).replace(FORMULA_START, "").trim();
}

/** Email: no spaces, no hidden characters, at most 254 characters. */
export function cleanEmail(value: string): string {
  return value.replace(INVISIBLE, "").replace(/[\s<>`{}|\\"(),;:[\]]/g, "").slice(0, LIMITS.email);
}

/**
 * Phone: only the characters a phone number is written with
 * (digits, space, + ( ) - . and x for an extension), at most 15
 * digits and 20 characters in all.
 */
export function cleanPhone(value: string): string {
  let digits = 0;
  let out = "";
  for (const ch of value.replace(/X/g, "x")) {
    if (/\d/.test(ch)) {
      if (digits >= 15) continue;
      digits += 1;
    } else if (!/[ +().\-x]/.test(ch)) {
      continue;
    }
    out += ch;
    if (out.length >= LIMITS.phone) break;
  }
  return out;
}

// ── Send limit ─────────────────────────────────────────────────────

const SENDS_KEY = "mg-brief-sends";
const WINDOW_MS = 60 * 60 * 1000; // one hour
const MAX_SENDS = 3; // briefs per browser per hour
const COOLDOWN_MS = 60 * 1000; // between two briefs

function readSends(now: number): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SENDS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((t): t is number => typeof t === "number" && now - t < WINDOW_MS) : [];
  } catch {
    return [];
  }
}

/** A reason to hold this send back, or null when it can go. */
export function sendBlocked(now = Date.now()): string | null {
  const sends = readSends(now);
  if (sends.length >= MAX_SENDS) {
    return "You've sent a few briefs in the last hour. Please call or email me instead.";
  }
  const last = Math.max(0, ...sends);
  if (now - last < COOLDOWN_MS) {
    return "Your last brief just went through. Give it a minute before sending another.";
  }
  return null;
}

/** Note a successful send. */
export function recordSend(now = Date.now()): void {
  try {
    localStorage.setItem(SENDS_KEY, JSON.stringify([...readSends(now), now]));
  } catch {
    // Private mode or storage blocked: the limit just doesn't apply.
  }
}

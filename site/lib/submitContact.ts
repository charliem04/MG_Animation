/**
 * ════════════════════════════════════════════════════════════════════
 *  CONTACT SUBMIT — where a lead actually goes.
 *
 *  Straight to Web3Forms from the browser. No server, no Worker, no
 *  build step between the form and the office inbox.
 *
 *  That is a deliberate choice, not a shortcut. The contact form is the
 *  revenue path: if it is down, the business is not taking work. A
 *  static page posting to a hosted form service has almost nothing that
 *  can break — no deploy of ours, no runtime of ours, no secret of ours
 *  to expire. Putting our own code in that path would add a thing that
 *  can fail at 2am, in exchange for hardening a form whose worst
 *  realistic outcome is spam in an inbox.
 *
 *  ── ABOUT THE ACCESS KEY ────────────────────────────────────────────
 *
 *  It ships in the JavaScript this page downloads. That is by design on
 *  Web3Forms' side: the key names a destination inbox and grants no
 *  account access, so the exposure is "someone can post to the office
 *  inbox", not "someone can read the account". Publishable is not the
 *  same as private, though — if the key starts drawing spam, rotate it
 *  from the Web3Forms dashboard, and turn on their spam protection
 *  before reaching for anything more elaborate.
 *
 *  NOT CONFIGURED: the form refuses and tells the visitor to phone.
 *  Silently swallowing a lead is worse than saying so.
 *
 *  ── VALIDATION ──────────────────────────────────────────────────────
 *
 *  Everything checked here is checked in a browser, and anything a
 *  browser checks can be skipped by not using a browser. The scrubbing
 *  below is therefore for the benefit of whoever reads the notification
 *  email — a name with a carriage return in it arrives as one inert
 *  line rather than something header-shaped — and not a security
 *  control. Web3Forms is the side that has to be robust to what it is
 *  sent.
 * ════════════════════════════════════════════════════════════════════
 */
import { client } from "@/client.config";
import { LIMITS, cleanEmail, cleanFinal, cleanPhone, cleanShort } from "@/lib/formSafety";


export type ContactPayload = {
  name: string;
  phone: string;
  /**
   * Required on the client's form. Web3Forms reads this field as the reply-to
   * on the notification, so the office replying to the email it gets
   * lands back with the customer.
   */
  email: string;
  /** Property the work is for; empty when the form does not ask */
  address: string;
  /** Which job — one of client.form.serviceOptions */
  service: string;
  /** How soon; empty when the form does not ask */
  urgency: string;
  /** Rough budget band; empty when not given */
  budget?: string;
  /** When the piece needs to ship, in the client's words */
  neededBy?: string;
  /** Free-text detail */
  message: string;
  /** Short reference shown to the visitor on the thank-you panel, so a
   *  reply or a call can point at the same brief Matt received. */
  reference?: string;
  /**
   * Honeypot — must be empty; bots fill it.
   *
   * Deliberately not named after anything a browser recognises. See the
   * field's markup in components/Contact.tsx for why that matters.
   */
  referralNote?: string;
  /**
   * Second honeypot: a hidden checkbox named "botcheck", Web3Forms' own
   * trap name. Bots that tick every box tick this one, and the brief is
   * dropped here, before anything is sent.
   */
  botcheck?: boolean;
  /**
   * When the form appeared on screen (Date.now()). A brief sent sooner
   * than MIN_FILL_MS after that was filled by a script, not a person.
   */
  startedAt?: number;
};

/**
 * Nobody types a name, email, phone number and project details in two
 * seconds. Kept short on purpose: a false positive throws away a real
 * lead, so this only catches the obviously automatic.
 */
const MIN_FILL_MS = 2000;

export type SubmitResult = { ok: true } | { ok: false; error: string };

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";
const FORM_ENDPOINT =
  process.env.NEXT_PUBLIC_FORM_ENDPOINT || "https://api.web3forms.com/submit";
const WEBHOOK_URL = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL ?? "";

/** Whether this build has anywhere to send a lead. */
export function contactConfigured(): boolean {
  return WEB3FORMS_KEY.length > 0;
}

const CALL_INSTEAD =
  "That didn't send. Please call or email me instead, so your brief doesn't get lost.";

/** Drop empty strings so the notification email has no blank rows. */
function compact(o: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ""));
}

export async function submitContact(
  payload: ContactPayload
): Promise<SubmitResult> {
  /*
   * Honeypot: report success so bots don't learn they were caught, but
   * send nothing anywhere.
   *
   * This is the one path in this file that discards a submission
   * without telling anybody, which makes a false positive here the most
   * expensive bug on the site — a real lead, thrown away, behind a green
   * tick. It has happened once already, to browser autofill; the field's
   * markup carries the rule that stops it recurring.
   *
   * So it says so in development, where somebody is watching. Never in
   * production: the silence there is the entire mechanism.
   */
  const trap = payload.referralNote
    ? "the hidden text field was filled in"
    : payload.botcheck
      ? "the hidden botcheck box was ticked"
      : payload.startedAt && Date.now() - payload.startedAt < MIN_FILL_MS
        ? `it was sent less than ${MIN_FILL_MS / 1000}s after the form appeared`
        : "";
  if (trap) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[contact] bot trap tripped (${trap}) — this submission was ` +
          "DISCARDED and nothing was sent to Web3Forms or the relay. " +
          "If you did not type in it, something is filling it for you " +
          "(browser autofill, a password manager, an extension). That is " +
          "a bug, not a caught bot: see components/Contact.tsx."
      );
    }
    return { ok: true };
  }

  // The last pass before anything leaves the browser: hidden and
  // command characters out, spacing squeezed, each field cut to its
  // limit (lib/formSafety.ts). The form already did this as it was
  // typed; this catches anything that skipped it.
  const fields = compact({
    name: cleanShort(payload.name, LIMITS.name),
    phone: cleanPhone(payload.phone).trim(),
    email: cleanEmail(payload.email),
    address: cleanShort(payload.address, 240),
    service: cleanShort(payload.service, 120),
    urgency: cleanShort(payload.urgency, 80),
    budget: cleanShort(payload.budget ?? "", 40),
    needed_by: cleanShort(payload.neededBy ?? "", LIMITS.neededByCustom),
    message: cleanFinal(payload.message, LIMITS.message, true),
    reference: cleanShort(payload.reference ?? "", 16),
  });

  const meta = {
    source: typeof window !== "undefined" ? window.location.href : "",
    submittedAt: new Date().toISOString(),
  };

  /*
   * ── THE SECOND COPY ──────────────────────────────────────────────
   * The flat lead, to the relay (workers/lead-relay), which stores it
   * and forwards it to whatever CRM is configured. Web3Forms' envelope
   * is not what a CRM wants, so this sends the fields themselves.
   *
   * Deliberately not awaited: a relay or CRM outage must not cost a
   * lead or show the customer an error, and the email below is the
   * copy that matters.
   *
   * `keepalive` is what makes an un-awaited request actually arrive. A
   * fetch nobody is waiting on is cancelled if the page navigates or
   * unloads before it completes, which is a real possibility on a form
   * whose success state is the visitor leaving. It costs nothing here —
   * the payload is far inside the 64KB keepalive limit.
   */
  if (WEBHOOK_URL) {
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, ...meta }),
      keepalive: true,
    }).catch((e) => console.warn("[contact] lead relay failed:", e));
  }

  if (!WEB3FORMS_KEY) {
    // Fail loudly and visibly. The old behaviour here was to return
    // success with nothing sent, which is how a site ships looking fine
    // and quietly loses every lead it takes.
    console.error(
      "[contact] NEXT_PUBLIC_WEB3FORMS_KEY is not set — no email destination is configured, so this submission was not delivered."
    );
    return { ok: false, error: CALL_INSTEAD };
  }

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        // The scrubbed name, not payload.name — an email subject is the
        // one field where a stray newline is genuinely header-shaped.
        // Urgency leads, so the office can triage from the inbox list
        // without opening anything: "[Emergency — ASAP] …" sorts itself.
        subject: `Project brief — ${fields.name ?? ""}${fields.service ? ` (${fields.service})` : ""}${fields.reference ? ` · ${fields.reference}` : ""}`,
        from_name: client.businessName,
        ...fields,
        ...meta,
      }),
    });

    // Web3Forms answers 200 with {success:false} for its own rejections
    // (bad key, spam heuristics), so the status alone is not the answer.
    const data = await res.json().catch(() => null);
    const accepted = res.ok && (data === null || data.success !== false);

    if (!accepted) {
      console.error("[contact] Web3Forms rejected the submission:", data);
      return { ok: false, error: CALL_INSTEAD };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Couldn't reach the server. Check your connection and try again, or call me.",
    };
  }
}

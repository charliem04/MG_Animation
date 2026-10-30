"use client";

/**
 * Contact: the ask and Matt's phone and email, big, on the left; the
 * project brief form on the right. The brief posts to Web3Forms through
 * lib/submitContact.ts.
 *
 * Name, email, phone and details are required. "Needed by" is one chip
 * from client.form.timelineOptions, or the custom chip with its own text.
 *
 * Every box is cleaned as it's typed and capped at its length
 * (lib/formSafety.ts), and the browser holds back repeat sends.
 *
 * Once a brief is sent the form switches off like an old CRT (squashes
 * to a glowing line, shrinks to a dot, gone) and the thank-you panel
 * powers on in its place: a recap of what was sent with a reference,
 * what happens next, and ways to keep going. Reduced motion skips
 * straight to the panel.
 */
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode, type RefObject } from "react";
import { scrollToPosition } from "@/components/SmoothScroll";
import { client } from "@/client.config";
import { submitContact } from "@/lib/submitContact";
import { dialable, PHONE_NUDGE } from "@/lib/phone";
import { LIMITS, cleanEmail, cleanPhone, cleanTyping, recordSend, sendBlocked } from "@/lib/formSafety";
import { trackEvent } from "@/lib/tracking";

type Status = "idle" | "sending" | "closing" | "sent" | "error";

/** What the thank-you panel recaps, kept from the form before it's cleared. */
type Sent = {
  firstName: string;
  reference: string;
  receivedAt: string;
  neededBy: string;
  services: string;
  budget: string;
};

/** Matches the form's switch-off in globals.css. */
const OFF_MS = 640;

/** A short, readable reference: MG- plus four characters, no 0/O/1/I. */
function makeReference(): string {
  const abc = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const n = new Uint8Array(4);
  crypto.getRandomValues(n);
  return "MG-" + Array.from(n, (b) => abc[b % abc.length]).join("");
}

function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  budget: "",
  neededBy: "",
  neededByCustom: "",
  message: "",
  referralNote: "", // honeypot: never name it after anything autofill knows
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROBLEM: Record<string, string> = {
  name: "Add your name so I know who I'm talking to.",
  email: "Add an email address I can reply to.",
  message: "Tell me a little about the project.",
  phone: "Add a phone number so I can call you back.",
  neededByCustom: "Add the date or deadline, or pick another option.",
};

const CUSTOM = client.form.timelineCustomLabel;
const ORDER: (keyof typeof EMPTY)[] = ["name", "email", "phone", "neededByCustom", "message"];

const PHONE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MAIL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="1" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);

/** One big, tappable way to reach Matt, with a copy button beside it. */
function ReachLine({
  label,
  href,
  value,
  icon,
  kind,
}: {
  label: string;
  href: string;
  value: string;
  icon: ReactNode;
  kind: "phone" | "email";
}) {
  const [done, setDone] = useState(false);
  return (
    <div className={`sg-reach sg-reach-${kind}`}>
      <a href={href} className="sg-reach-link">
        <span className="sg-reach-icon">{icon}</span>
        <span className="sg-reach-text">
          <span className="sg-label">{label}</span>
          <span className="sg-reach-value">{value}</span>
        </span>
      </a>
      <button
        type="button"
        className="sg-btn sg-btn-ghost sg-btn-sm"
        aria-label={`Copy ${value}`}
        onClick={() => {
          navigator.clipboard
            ?.writeText(value)
            .then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1400);
            })
            .catch(() => {});
        }}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function SignalContact() {
  const [form, setForm] = useState(EMPTY);
  const [services, setServices] = useState<string[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const sentHeading = useRef<HTMLHeadingElement>(null);
  // Bot traps (see lib/submitContact.ts): a hidden checkbox, and when
  // the form appeared, to spot briefs filled in faster than a person can.
  const [botcheck, setBotcheck] = useState(false);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Each box's own cleaning, run on every keystroke and paste.
  const CLEAN: Partial<Record<keyof typeof EMPTY, (v: string) => string>> = {
    name: (v) => cleanTyping(v, LIMITS.name),
    email: cleanEmail,
    phone: cleanPhone,
    neededByCustom: (v) => cleanTyping(v, LIMITS.neededByCustom),
    message: (v) => cleanTyping(v, LIMITS.message, true),
  };

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    const clean = CLEAN[key];
    const value = clean ? clean(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (value.trim()) setInvalid((v) => v.filter((k) => k !== key));
  };

  const toggle = (s: string) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const problems: (keyof typeof EMPTY)[] = (["name", "email", "phone", "message"] as const).filter((k) => !form[k].trim());
    if (form.email.trim() && !EMAIL.test(form.email.trim()) && !problems.includes("email")) {
      problems.push("email");
    }
    if (form.phone.trim() && !dialable(form.phone)) problems.push("phone");
    if (form.neededBy === CUSTOM && !form.neededByCustom.trim()) problems.push("neededByCustom");
    // Focus the first problem in the order the fields appear.
    problems.sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y));
    setInvalid(problems);
    if (problems.length) {
      document.getElementById(`f-${problems[0]}`)?.focus();
      return;
    }

    const blocked = sendBlocked();
    if (blocked) {
      setError(blocked);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");
    const reference = makeReference();
    const neededBy = form.neededBy === CUSTOM ? form.neededByCustom.trim() : form.neededBy;
    const result = await submitContact({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: "",
      service: services.join(", "),
      urgency: "",
      budget: form.budget,
      neededBy,
      message: form.message,
      reference,
      referralNote: form.referralNote,
      botcheck,
      startedAt: startedAt.current,
    });
    if (result.ok) {
      recordSend();
      setSent({
        firstName: form.name.trim().split(" ").filter(Boolean)[0] ?? "",
        reference,
        receivedAt: new Date().toLocaleString(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
        neededBy,
        services: services.join(", "),
        budget: form.budget,
      });
      setStatus(reducedMotion() ? "sent" : "closing");
      trackEvent("Form submit", { service: services.join(", ") || "unspecified" });
      setForm(EMPTY);
      setServices([]);
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  // The switch-off ends on animationend; the timer covers a tab that
  // never paints it (hidden, or a browser that skips the animation).
  useEffect(() => {
    if (status !== "closing") return;
    const t = setTimeout(() => setStatus("sent"), OFF_MS + 200);
    return () => clearTimeout(t);
  }, [status]);

  // When the panel arrives: move focus to it for screen readers, and
  // bring it into view if the shorter panel left the visitor past it.
  useEffect(() => {
    if (status !== "sent") return;
    const h = sentHeading.current;
    if (!h) return;
    h.focus({ preventScroll: true });
    const top = h.closest(".sg-sent")?.getBoundingClientRect().top ?? 0;
    if (top < 80 || top > window.innerHeight * 0.6) scrollToPosition(window.scrollY + top - 96);
  }, [status]);

  function sendAnother() {
    setSent(null);
    setStatus("idle");
    startedAt.current = Date.now();
    setTimeout(() => document.getElementById("f-name")?.focus(), 0);
  }

  const err = (k: string) =>
    invalid.includes(k) ? (
      <span id={`f-${k}-err`} className="sg-error">
        {k === "email" && form.email.trim()
          ? "That email doesn't look right. Check it over."
          : k === "phone" && form.phone.trim()
            ? PHONE_NUDGE
            : PROBLEM[k]}
      </span>
    ) : null;
  const aria = (k: string) => ({
    "aria-invalid": invalid.includes(k) || undefined,
    "aria-describedby": invalid.includes(k) ? `f-${k}-err` : undefined,
  });

  return (
    <section id="contact" className="section sg-contact" data-wipe aria-labelledby="contact-h">
      <div>
        <span className="sg-label sg-signal sg-glow">{client.copy.contactEyebrow}</span>
        <h2 id="contact-h" className="sg-ab">
          {client.copy.contactHeading}
        </h2>
        <p className="sg-contact-lede">{client.copy.contactLede}</p>
        <div className="sg-quick">
          <ReachLine kind="phone" label="Call Matt" href={`tel:${client.phoneHref}`} value={client.phone} icon={PHONE_ICON} />
          <ReachLine kind="email" label="Email Matt" href={`mailto:${client.email}`} value={client.email} icon={MAIL_ICON} />
        </div>
      </div>

      {status === "sent" && sent ? (
        <SentPanel sent={sent} headingRef={sentHeading} onAnother={sendAnother} />
      ) : (
        <form
          className={`sg-form${status === "closing" ? " sg-form-off" : ""}`}
          onSubmit={onSubmit}
          noValidate
          aria-busy={status === "closing" || undefined}
          {...(status === "closing" ? { inert: "" as unknown as boolean } : {})}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && e.animationName === "sg-power-off") setStatus("sent");
          }}
        >
          <div className="sg-f2">
            <label className="sg-field" htmlFor="f-name">
              <span className="sg-label">Name</span>
              <input id="f-name" className="sg-input" type="text" autoComplete="name" maxLength={LIMITS.name} required value={form.name} onChange={set("name")} {...aria("name")} />
              {err("name")}
            </label>
            <label className="sg-field" htmlFor="f-email">
              <span className="sg-label">Email</span>
              <input id="f-email" className="sg-input" type="email" autoComplete="email" maxLength={LIMITS.email} required value={form.email} onChange={set("email")} {...aria("email")} />
              {err("email")}
            </label>
          </div>

          <div className="sg-f2">
            <label className="sg-field" htmlFor="f-phone">
              <span className="sg-label">Phone</span>
              <input
                id="f-phone"
                className="sg-input"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={LIMITS.phone}
                placeholder="337-555-0123"
                required
                value={form.phone} onChange={set("phone")} {...aria("phone")} />
              {err("phone")}
            </label>
            <label className="sg-field" htmlFor="f-budget">
              <span className="sg-label">Budget</span>
              <select id="f-budget" className="sg-input" value={form.budget} onChange={set("budget")}>
                <option value="">Not sure yet</option>
                {client.form.budgetOptions.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="sg-field">
            <legend className="sg-label" style={{ padding: 0, marginBottom: 8 }}>
              What do you need
            </legend>
            <div className="sg-chips">
              {client.form.serviceOptions.map((s) => (
                <label key={s} className="sg-chip">
                  <input type="checkbox" checked={services.includes(s)} onChange={() => toggle(s)} />
                  <b>{s}</b>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="sg-field">
            <legend className="sg-label" style={{ padding: 0, marginBottom: 8 }}>
              Needed by
            </legend>
            <div className="sg-chips">
              {[...client.form.timelineOptions, CUSTOM].map((t) => (
                <label key={t} className="sg-chip">
                  <input
                    type="radio"
                    name="neededBy"
                    value={t}
                    checked={form.neededBy === t}
                    onChange={() => {
                      setForm((f) => ({ ...f, neededBy: t }));
                      if (t !== CUSTOM) setInvalid((v) => v.filter((k) => k !== "neededByCustom"));
                    }}
                    onClick={() => {
                      // Clicking the picked chip again clears it, so the field stays optional.
                      if (form.neededBy === t) setForm((f) => ({ ...f, neededBy: "" }));
                    }}
                  />
                  <b>{t === CUSTOM ? `${t}…` : t}</b>
                </label>
              ))}
            </div>
            {form.neededBy === CUSTOM && (
              <>
                <input
                  id="f-neededByCustom"
                  className="sg-input"
                  type="text"
                  placeholder="e.g. March 14, or before our spring launch"
                  maxLength={LIMITS.neededByCustom}
                  aria-label="Date or deadline"
                  value={form.neededByCustom}
                  onChange={set("neededByCustom")}
                  autoFocus
                  {...aria("neededByCustom")}
                />
                {err("neededByCustom")}
              </>
            )}
          </fieldset>

          <label className="sg-field" htmlFor="f-message">
            <span className="sg-label sg-label-row">
              <span>Project details</span>
              <span className="sg-count" aria-hidden="true">
                {form.message.length}/{LIMITS.message}
              </span>
            </span>
            <textarea id="f-message" className="sg-input" rows={4} maxLength={LIMITS.message} required value={form.message} onChange={set("message")} {...aria("message")} />
            {err("message")}
          </label>

          {/* Honeypots. Off-screen, out of the tab order, and named after
              nothing a browser or password manager would autofill. People
              never see them; bots that fill or tick everything trip them. */}
          <label style={{ position: "absolute", left: -9999 }} aria-hidden="true">
            Leave blank
            <input name="referralNote" tabIndex={-1} autoComplete="off" maxLength={80} value={form.referralNote} onChange={set("referralNote")} />
          </label>
          <label style={{ position: "absolute", left: -9999 }} aria-hidden="true">
            Don&rsquo;t tick this
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" checked={botcheck} onChange={(e) => setBotcheck(e.target.checked)} />
          </label>

          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button className="sg-btn sg-btn-primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : client.copy.contactSubmit}
            </button>
            <span className="sg-status" role="status" aria-live="polite" style={{ color: "rgb(var(--danger))" }}>
              {status === "error" ? error : ""}
            </span>
          </div>
        </form>
      )}
    </section>
  );
}

/** Staggers each block of the panel in after the power-on. */
const step = (i: number) => ({ "--i": i }) as CSSProperties;

/** The thank-you that powers on where the form was. */
function SentPanel({
  sent,
  headingRef,
  onAnother,
}: {
  sent: Sent;
  headingRef: RefObject<HTMLHeadingElement>;
  onAnother: () => void;
}) {
  const recap: [string, string][] = [
    ["Reference", sent.reference],
    ["Received", sent.receivedAt],
    ["Needed by", sent.neededBy || "Flexible"],
    ["Services", sent.services || "To discuss"],
    ["Budget", sent.budget || "Not sure yet"],
  ];
  return (
    <div className="sg-sent">
      <span className="sg-label sg-signal sg-glow sg-rec" style={step(0)}>
        {client.copy.contactSentEyebrow}
      </span>
      <h3 ref={headingRef} tabIndex={-1} className="sg-sent-h sg-ab" style={step(1)}>
        Thanks{sent.firstName ? `, ${sent.firstName}` : ""}.
      </h3>
      <p className="sg-sent-lede" style={step(2)}>
        {client.copy.contactConfirmation} Your brief is in my inbox now.
      </p>

      <dl className="sg-slate" style={step(3)}>
        {recap.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div style={step(4)}>
        <span className="sg-label">What happens next</span>
        <ol className="sg-next">
          {client.copy.contactNextSteps.map((s, i) => (
            <li key={s.title}>
              <span className="sg-next-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <b>{s.title}</b>
                <span>{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="sg-sent-actions" style={step(5)}>
        <a className="sg-btn sg-btn-primary" href={`tel:${client.phoneHref}`}>
          Need it sooner? Call
        </a>
        <a className="sg-btn sg-btn-ghost" href="#reel">
          Watch the reel
        </a>
        <button type="button" className="sg-btn sg-btn-ghost" onClick={onAnother}>
          Send another brief
        </button>
      </div>
    </div>
  );
}

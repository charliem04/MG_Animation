"use client";

/**
 * Contact: the ask and the two quick rows on the left, the project
 * brief form on the right. The brief posts to Web3Forms through
 * lib/submitContact.ts, the same path the template has always used.
 *
 * Only name, email and details are required — a brief is a
 * conversation starter, not an intake questionnaire. Phone is optional
 * but checked if given. "Needed by" is one chip from
 * client.form.timelineOptions, or the custom chip with its own text.
 */
import { useState, type FormEvent } from "react";
import { client } from "@/client.config";
import { submitContact } from "@/lib/submitContact";
import { dialable, PHONE_NUDGE } from "@/lib/phone";
import { trackEvent } from "@/lib/tracking";

type Status = "idle" | "sending" | "sent" | "error";

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
  phone: PHONE_NUDGE,
  neededByCustom: "Add the date or deadline, or pick another option.",
};

const CUSTOM = client.form.timelineCustomLabel;
const ORDER: (keyof typeof EMPTY)[] = ["name", "email", "phone", "neededByCustom", "message"];

function CopyRow({ label, href, value }: { label: string; href: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="sg-qrow">
      <span className="sg-label">{label}</span>
      <a href={href}>{value}</a>
      <button
        type="button"
        className="sg-btn sg-btn-ghost sg-btn-sm"
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

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (value.trim()) setInvalid((v) => v.filter((k) => k !== key));
  };

  const toggle = (s: string) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const problems: (keyof typeof EMPTY)[] = (["name", "email", "message"] as const).filter((k) => !form[k].trim());
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

    setStatus("sending");
    setError("");
    const result = await submitContact({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: "",
      service: services.join(", "),
      urgency: "",
      budget: form.budget,
      neededBy: form.neededBy === CUSTOM ? form.neededByCustom : form.neededBy,
      message: form.message,
      referralNote: form.referralNote,
    });
    if (result.ok) {
      setStatus("sent");
      trackEvent("Form submit", { service: services.join(", ") || "unspecified" });
      setForm(EMPTY);
      setServices([]);
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  const err = (k: string) =>
    invalid.includes(k) ? (
      <span id={`f-${k}-err`} className="sg-error">
        {k === "email" && form.email.trim() ? "That email doesn't look right. Check it over." : PROBLEM[k]}
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
          <CopyRow label="Call" href={`tel:${client.phoneHref}`} value={client.phone} />
          <CopyRow label="Email" href={`mailto:${client.email}`} value={client.email} />
        </div>
      </div>

      {status === "sent" ? (
        <div className="sg-form" role="status" aria-live="polite">
          <span className="sg-label sg-signal">Brief received</span>
          <p style={{ margin: 0, fontSize: 18 }}>{client.copy.contactConfirmation}</p>
        </div>
      ) : (
        <form className="sg-form" onSubmit={onSubmit} noValidate>
          <div className="sg-f2">
            <label className="sg-field" htmlFor="f-name">
              <span className="sg-label">Name</span>
              <input id="f-name" className="sg-input" type="text" autoComplete="name" value={form.name} onChange={set("name")} {...aria("name")} />
              {err("name")}
            </label>
            <label className="sg-field" htmlFor="f-email">
              <span className="sg-label">Email</span>
              <input id="f-email" className="sg-input" type="email" autoComplete="email" value={form.email} onChange={set("email")} {...aria("email")} />
              {err("email")}
            </label>
          </div>

          <div className="sg-f2">
            <label className="sg-field" htmlFor="f-phone">
              <span className="sg-label">
                Phone <span className="sg-opt">(optional)</span>
              </span>
              <input id="f-phone" className="sg-input" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} {...aria("phone")} />
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
            <span className="sg-label">Project details</span>
            <textarea id="f-message" className="sg-input" rows={4} value={form.message} onChange={set("message")} {...aria("message")} />
            {err("message")}
          </label>

          {/* Honeypot. Off-screen, out of the tab order, and named after
              nothing a browser or password manager would autofill. */}
          <label style={{ position: "absolute", left: -9999 }} aria-hidden="true">
            Leave blank
            <input name="referralNote" tabIndex={-1} autoComplete="off" value={form.referralNote} onChange={set("referralNote")} />
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

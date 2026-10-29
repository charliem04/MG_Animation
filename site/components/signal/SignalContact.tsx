"use client";

/**
 * Contact: the ask and the two quick rows on the left, the project
 * brief form on the right. The brief posts to Web3Forms through
 * lib/submitContact.ts, the same path the template has always used.
 *
 * Only name, email and details are required — a brief is a
 * conversation starter, not an intake questionnaire.
 */
import { useState, type FormEvent } from "react";
import { client } from "@/client.config";
import { submitContact } from "@/lib/submitContact";
import { trackEvent } from "@/lib/tracking";

type Status = "idle" | "sending" | "sent" | "error";

const EMPTY = {
  name: "",
  email: "",
  budget: "",
  neededBy: "",
  message: "",
  referralNote: "", // honeypot: never name it after anything autofill knows
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROBLEM: Record<string, string> = {
  name: "Add your name so I know who I'm talking to.",
  email: "Add an email address I can reply to.",
  message: "Tell me a little about the project.",
};

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
    const problems = (["name", "email", "message"] as const).filter((k) => !form[k].trim());
    if (form.email.trim() && !EMAIL.test(form.email.trim()) && !problems.includes("email")) {
      problems.push("email");
    }
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
      phone: "",
      address: "",
      service: services.join(", "),
      urgency: "",
      budget: form.budget,
      neededBy: form.neededBy,
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

          <div className="sg-f2">
            <label className="sg-field" htmlFor="f-budget">
              <span className="sg-label">Budget</span>
              <select id="f-budget" className="sg-input" value={form.budget} onChange={set("budget")}>
                <option value="">Not sure yet</option>
                {client.form.budgetOptions.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="sg-field" htmlFor="f-when">
              <span className="sg-label">Needed by</span>
              <input id="f-when" className="sg-input" type="text" value={form.neededBy} onChange={set("neededBy")} />
            </label>
          </div>

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

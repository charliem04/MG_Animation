/**
 * The terms of service page (/terms/). Matt edits content/terms.json in
 * Pages CMS (the "Terms of service" screen); this file checks it at
 * build time so a bad save stops the build and the last good version
 * stays live.
 *
 * The page adds two things that aren't in the CMS on purpose: a link
 * to the Privacy Policy (which is managed in code, not by Matt) and a
 * contact line read from client.config.ts, so the phone number and
 * email there can't drift out of date.
 *
 * Not legal advice. Worth having an attorney read before relying on it.
 */
import data from "./terms.json";

export type TermsSection = { heading: string; body: string };

export type Terms = {
  /** The "last updated" date, YYYY-MM-DD as Pages CMS saves it. */
  updated: string;
  intro: string;
  sections: TermsSection[];
};

/** "2026-10-30" → "October 30, 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** A body split into paragraphs at blank lines. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

function checkTerms(t: Terms): Terms {
  const problems: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.updated ?? "") || Number.isNaN(Date.parse(t.updated))) {
    problems.push("the \"last updated\" date is missing or not a date");
  }
  if (!t.intro?.trim()) problems.push("the intro is empty");
  const sections = (t.sections ?? []).filter((s) => s.heading?.trim() || s.body?.trim());
  if (!sections.length) problems.push("add at least one section");
  sections.forEach((s, i) => {
    if (!s.heading?.trim()) problems.push(`section ${i + 1} has no heading`);
    if (!s.body?.trim()) problems.push(`section ${i + 1} ("${s.heading.trim()}") has no text`);
  });
  if (problems.length) {
    throw new Error(`[terms] content/terms.json needs fixing:\n  - ${problems.join("\n  - ")}`);
  }
  return {
    updated: t.updated,
    intro: t.intro.trim(),
    sections: sections.map((s) => ({ heading: s.heading.trim(), body: s.body.trim() })),
  };
}

export const terms = checkTerms(data as Terms);

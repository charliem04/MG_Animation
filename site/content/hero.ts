/**
 * The words at the top of the home page, beside the showreel. Matt
 * edits content/hero.json in Pages CMS (the "Hero" screen); this file
 * checks it at build time so a bad save stops the build and the last
 * good version stays live.
 *
 * The limits keep the giant name and the buttons from breaking the
 * layout on a phone. Pages CMS enforces the same limits in .pages.yml.
 */
import data from "./hero.json";

export type Hero = {
  name: string;
  line2: string;
  intro: string;
  primaryButton: string;
  secondaryButton: string;
};

const LIMITS: Record<keyof Hero, [label: string, max: number]> = {
  name: ["the name", 24],
  line2: ["the second line", 32],
  intro: ["the intro sentence", 220],
  primaryButton: ["the orange button", 24],
  secondaryButton: ["the outline button", 24],
};

function checkHero(h: Hero): Hero {
  const problems: string[] = [];
  const clean = {} as Hero;
  for (const key of Object.keys(LIMITS) as (keyof Hero)[]) {
    const [label, max] = LIMITS[key];
    const value = (h[key] ?? "").trim();
    if (!value) problems.push(`${label} is empty`);
    else if (value.length > max) problems.push(`${label} is ${value.length} characters (keep it to ${max})`);
    clean[key] = value;
  }
  if (problems.length) {
    throw new Error(`[hero] content/hero.json needs fixing:\n  - ${problems.join("\n  - ")}`);
  }
  return clean;
}

export const hero = checkHero(data as Hero);

/**
 * The About section on the home page. Matt edits content/about.json
 * in Pages CMS (the "About" screen); this file checks it at build time
 * so a bad save stops the build and the last good version stays live.
 */
import data from "./about.json";

export type About = {
  heading: string;
  body: string[];
  headshot: string;
  headshotAlt: string;
  name: string;
  title: string;
};

function checkAbout(a: About): About {
  const problems: string[] = [];
  if (!a.heading?.trim()) problems.push("the section heading is empty");
  if (!a.body?.some((p) => p.trim())) problems.push("add at least one paragraph");
  if (!a.headshot?.trim()) problems.push("the headshot is missing");
  if (!a.name?.trim()) problems.push("the name under the headshot is empty");
  if (problems.length) {
    throw new Error(`[about] content/about.json needs fixing:\n  - ${problems.join("\n  - ")}`);
  }
  return { ...a, body: a.body.filter((p) => p.trim()) };
}

export const about = checkAbout(data as About);

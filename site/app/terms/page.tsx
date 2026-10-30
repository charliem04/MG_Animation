import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { client } from "@/client.config";
import { isIndexable } from "@/lib/routes";
import { LegalPage } from "../legal";
import { robotsFor } from "@/lib/meta";
import { terms, formatDate, paragraphs } from "@/content/terms";

export const metadata: Metadata = {
  title: `Terms of Service — ${client.businessName}`,
  // From the route registry, the same flag that keeps it out of the
  // sitemap, so the tag and the sitemap can't drift apart.
  robots: robotsFor(isIndexable("/terms/")),
};

/*
 * The wording comes from content/terms.json, which Matt edits in Pages
 * CMS. The privacy link and the contact section at the bottom are
 * fixed here on purpose; see content/terms.ts.
 */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>Last updated {formatDate(terms.updated)}</p>
      <p>{terms.intro}</p>

      {terms.sections.map((s, n) => (
        <Fragment key={n}>
          <h2>{s.heading}</h2>
          {paragraphs(s.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Fragment>
      ))}

      <h2>Privacy</h2>
      <p>
        How information you send through this site is collected and used is
        covered in the <Link href="/privacy/">Privacy Policy</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href={`mailto:${client.email}`}>{client.email}</a> or call{" "}
        <a href={`tel:${client.phoneHref}`}>{client.phone}</a>.
      </p>
    </LegalPage>
  );
}

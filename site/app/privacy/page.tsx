import type { Metadata } from "next";
import { client } from "@/client.config";
import { isIndexable } from "@/lib/routes";
import { LegalPage } from "../legal";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: `Privacy Policy — ${client.businessName}`,
  description: `What ${client.businessName}'s website collects, where it goes, and your choices.`,
  path: "/privacy/",
  index: isIndexable("/privacy/"),
});

/*
 * Managed in code by the site's developer, NOT in Pages CMS, on
 * purpose: it describes what the code collects and where it sends it,
 * so it changes when the code does. (The terms of service are Matt's,
 * in the CMS.)
 *
 * Keep this true to what the site actually does. It describes:
 *   · the brief form → Web3Forms → Matt's email (lib/submitContact.ts)
 *   · Vimeo's player, loaded only on play (components/signal/VideoLightbox.tsx)
 *   · Plausible analytics, only after consent and only if
 *     NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set (components/Analytics.tsx)
 *   · the consent choice in localStorage (lib/consent.ts)
 * Switch on anything else (a CRM copy of leads, call tracking, a
 * booking embed, social embeds) and this page needs a line for it.
 * Not legal advice; have it read before launch if in doubt.
 */
const EFFECTIVE = "October 29, 2026";
const ANALYTICS_ON = Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Effective {EFFECTIVE}</p>

      <p>
        This site belongs to {client.businessName}. It collects very little,
        and this page says exactly what and why.
      </p>

      <h2>The project brief form</h2>
      <p>
        When you send a brief, everything you enter is sent to me by email:
        your name, email address, phone number, the services you picked,
        budget, the date you need it by and your project details. The email also records the
        page you sent it from and the time it was sent.
      </p>
      <p>
        The form is delivered by Web3Forms, which passes it on to my email
        inbox ({client.email}, a Google Gmail account). Your brief is kept in
        that inbox so I can reply and keep track of the project. I use it only
        to talk to you about your project. I don&rsquo;t sell it, share it
        for marketing or add you to a mailing list.
      </p>

      <h2>Videos</h2>
      <p>
        The work and the full showreel play in Vimeo&rsquo;s video player.
        The site asks Vimeo not to track you (its &ldquo;do not track&rdquo;
        setting), but like any website Vimeo receives basic technical details
        such as your IP address and browser when a video loads. Vimeo&rsquo;s
        own privacy policy covers what it does with them. Nothing loads from
        Vimeo until you press play.
      </p>

      <h2>Analytics</h2>
      {ANALYTICS_ON ? (
        <p>
          If you click Accept on the banner, the site loads Plausible, a
          privacy-friendly analytics tool that counts page visits. It sets no
          cookies and doesn&rsquo;t follow you to other sites. If you click
          Decline, it never loads. Your choice is saved in your browser so
          the banner doesn&rsquo;t ask again.
        </p>
      ) : (
        <p>
          The site doesn&rsquo;t run analytics or set cookies. Cloudflare,
          which hosts it, keeps standard server logs (such as IP address and
          the page requested) to run and protect the site.
        </p>
      )}

      <h2>Your information</h2>
      <p>
        To see, correct or delete anything you&rsquo;ve sent me, email{" "}
        <a href={`mailto:${client.email}`}>{client.email}</a> or call{" "}
        <a href={`tel:${client.phoneHref}`}>{client.phone}</a> and I&rsquo;ll
        take care of it.
      </p>
    </LegalPage>
  );
}

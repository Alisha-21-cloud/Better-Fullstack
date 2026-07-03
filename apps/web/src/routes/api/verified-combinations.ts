import { createFileRoute } from "@tanstack/react-router";

import { verifiedCombinationsSummary } from "@/lib/docs/verified-combinations-data";
import { NOINDEX_ROBOTS } from "@/lib/robots";

type ShieldsEndpointPayload = {
  schemaVersion: 1;
  label: string;
  message: string;
  color: "brightgreen" | "yellow" | "red";
  namedLogo?: string;
};

function totals() {
  const smoke = verifiedCombinationsSummary.smoke.reduce(
    (acc, item) => ({ pass: acc.pass + item.pass, total: acc.total + item.total }),
    { pass: 0, total: 0 },
  );
  const scaffbench = verifiedCombinationsSummary.scaffbench.reduce(
    (acc, item) => ({ pass: acc.pass + item.pass, total: acc.total + item.total }),
    { pass: 0, total: 0 },
  );
  const releaseGuard = verifiedCombinationsSummary.releaseGuard
    ? {
        pass: verifiedCombinationsSummary.releaseGuard.pass,
        total: verifiedCombinationsSummary.releaseGuard.total,
      }
    : { pass: 0, total: 1 };
  const publishedPackage = verifiedCombinationsSummary.publishedPackage
    ? {
        pass: verifiedCombinationsSummary.publishedPackage.pass,
        total: verifiedCombinationsSummary.publishedPackage.total,
      }
    : { pass: 0, total: 3 };

  return {
    pass: smoke.pass + scaffbench.pass + releaseGuard.pass + publishedPackage.pass,
    total: smoke.total + scaffbench.total + releaseGuard.total + publishedPackage.total,
  };
}

function badgePayload(): ShieldsEndpointPayload {
  const { pass, total } = totals();
  const allPassing = total > 0 && pass === total;
  const color = allPassing ? "brightgreen" : pass > 0 ? "yellow" : "red";

  return {
    schemaVersion: 1,
    label: "verified combinations",
    message: `${pass}/${total} passing`,
    color,
    namedLogo: "githubactions",
  };
}

export const Route = createFileRoute("/api/verified-combinations")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(badgePayload(), {
          headers: {
            "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=1800",
            "Content-Type": "application/json",
            "X-Robots-Tag": NOINDEX_ROBOTS,
          },
        }),
    },
  },
});

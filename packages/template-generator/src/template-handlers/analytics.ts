import type { ProjectConfig } from "@better-fullstack/types";

import type { VirtualFileSystem } from "../core/virtual-fs";

import { type TemplateData, processTemplatesFromPrefix } from "./utils";

const REACT_FRONTENDS = new Set([
  "tanstack-router",
  "react-router",
  "react-vite",
  "tanstack-start",
  "next",
  "vinext",
]);

const SVELTE_FRONTENDS = new Set(["svelte"]);
const VUE_FRONTENDS = new Set(["nuxt", "vue"]);
const SOLID_FRONTENDS = new Set(["solid", "solid-start"]);

function getAnalyticsTemplateVariant(frontend: readonly string[]): string | null {
  if (frontend.some((f) => REACT_FRONTENDS.has(f))) return "react";
  if (frontend.some((f) => SVELTE_FRONTENDS.has(f))) return "svelte";
  if (frontend.some((f) => VUE_FRONTENDS.has(f))) return "vue";
  if (frontend.some((f) => SOLID_FRONTENDS.has(f))) return "solid";
  return null;
}

export async function processAnalyticsTemplates(
  vfs: VirtualFileSystem,
  templates: TemplateData,
  config: ProjectConfig,
): Promise<void> {
  if (!config.analytics || config.analytics === "none") return;

  if (config.analytics === "ga4") {
    if (vfs.exists("apps/web/package.json")) {
      processTemplatesFromPrefix(vfs, templates, "analytics/ga4/web/base", "apps/web", config);
    }
    return;
  }

  const variant = getAnalyticsTemplateVariant(config.frontend);
  if (!variant) return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    `analytics/${config.analytics}/web/${variant}`,
    "apps/web",
    config,
  );
}

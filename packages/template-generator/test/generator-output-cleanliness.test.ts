import type { ProjectConfig } from "@better-fullstack/types";

import { describe, expect, it } from "bun:test";

import type { VirtualFile, VirtualNode } from "../src/types";

import { generateVirtualProject } from "../src/generator";
import { EMBEDDED_TEMPLATES } from "../src/templates.generated";
import { makeConfig } from "./_fixtures/config-factory";

function listFiles(node: VirtualNode): VirtualFile[] {
  return node.type === "file" ? [node] : node.children.flatMap(listFiles);
}

const ECOSYSTEM_CONFIGS = [
  makeConfig({ ecosystem: "typescript" }),
  makeConfig({
    ecosystem: "react-native",
    frontend: ["native-bare"],
    backend: "none",
    runtime: "none",
    database: "none",
    orm: "none",
    api: "none",
  }),
  makeConfig({ ecosystem: "rust", rustWebFramework: "axum" }),
  makeConfig({ ecosystem: "python", pythonWebFramework: "fastapi" }),
  makeConfig({ ecosystem: "go", goWebFramework: "gin" }),
  makeConfig({ ecosystem: "java", javaWebFramework: "spring-boot", javaBuildTool: "maven" }),
  makeConfig({
    ecosystem: "dotnet",
    dotnetWebFramework: "aspnet-minimal",
    dotnetOrm: "ef-core",
    dotnetAuth: "aspnet-identity",
    dotnetApi: "minimal-api",
  }),
  makeConfig({
    ecosystem: "elixir",
    elixirWebFramework: "phoenix",
    elixirOrm: "ecto-sql",
    elixirApi: "rest",
  }),
] satisfies ProjectConfig[];

describe("generated output cleanliness", () => {
  for (const config of ECOSYSTEM_CONFIGS) {
    it(`does not emit empty template files for ${config.ecosystem}`, async () => {
      const result = await generateVirtualProject({ config, templates: EMBEDDED_TEMPLATES });

      expect(result.success).toBe(true);
      expect(result.tree).toBeDefined();

      const emptyFiles = listFiles(result.tree!.root)
        .filter((file) => file.content.trim() === "")
        .map((file) => file.path);

      expect(emptyFiles).toEqual([]);
    });
  }
});

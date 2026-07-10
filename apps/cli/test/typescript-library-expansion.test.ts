import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { resolveAIPrompt } from "../src/prompts/ai";
import { resolveCSSFrameworkPrompt } from "../src/prompts/css-framework";
import { resolvePaymentsPrompt } from "../src/prompts/payments";
import { resolveRealtimePrompt } from "../src/prompts/realtime";
import { runWithContext } from "../src/utils/context";
import { validateConfigForProgrammaticUse } from "../src/utils/config-validation";
import { createCustomConfig, expectSuccess, runTRPCTest } from "./test-utils";

async function readGenerated(projectDir: string | undefined, path: string): Promise<string> {
  expect(projectDir).toBeDefined();
  return readFile(join(projectDir!, path), "utf8");
}

async function expectGeneratedFile(
  projectDir: string | undefined,
  path: string,
  expectedText: string,
): Promise<void> {
  expect(await readGenerated(projectDir, path)).toContain(expectedText);
}

describe("TypeScript library expansion", () => {
  test("scaffolds the broad React, Express, and GraphQL integration set", async () => {
    const result = await runTRPCTest(
      createCustomConfig({
        projectName: "typescript-library-expansion-react",
        frontend: ["react-vite"],
        backend: "express",
        runtime: "node",
        api: "apollo-server",
        database: "sqlite",
        orm: "drizzle",
        auth: "passport",
        payments: "paypal",
        addons: [
          "eslint",
          "prettier",
          "axios",
          "firebase",
          "graphql-codegen",
          "apollo-client",
          "electron",
        ],
        cssFramework: "styled-components",
        uiLibrary: "none",
        testing: "mocha",
        realtime: "ws",
        cms: "contentful",
        analytics: "ga4",
        ai: "openai-sdk",
      }),
    );

    expectSuccess(result);

    const rootPackage = await readGenerated(result.projectDir, "package.json");
    const webPackage = await readGenerated(result.projectDir, "apps/web/package.json");
    const serverPackage = await readGenerated(result.projectDir, "apps/server/package.json");
    const authPackage = await readGenerated(result.projectDir, "packages/auth/package.json");

    for (const dependency of ["eslint", "prettier"]) expect(rootPackage).toContain(dependency);
    for (const dependency of [
      "axios",
      "firebase",
      "@graphql-codegen/cli",
      "@apollo/client",
      "electron",
      "styled-components",
      "contentful",
      "@paypal/paypal-js",
      "mocha",
    ]) {
      expect(webPackage).toContain(dependency);
    }
    expect(webPackage).toContain("mocha --import=tsx");
    expect(webPackage).toContain("concurrently -k");
    expect(webPackage).toContain("ELECTRON_RENDERER_URL=http://localhost:5173");
    for (const dependency of ["openai", "ws", "@paypal/paypal-server-sdk", "mocha"]) {
      expect(serverPackage).toContain(dependency);
    }
    for (const dependency of ["passport", "passport-github2"]) {
      expect(authPackage).toContain(dependency);
    }
    expect(authPackage).toContain('"check-types": "tsc --noEmit"');

    await expectGeneratedFile(result.projectDir, "eslint.config.mjs", "typescript-eslint");
    await expectGeneratedFile(result.projectDir, ".prettierrc.json", "trailingComma");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/http-client.ts", "axios.create");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/firebase.ts", "initializeApp");
    await expectGeneratedFile(result.projectDir, "apps/web/codegen.ts", 'preset: "client"');
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/apollo-client.ts", "ApolloClient");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/apollo-client.ts", "env.VITE_SERVER_URL");
    await expectGeneratedFile(result.projectDir, "apps/web/electron/main.mjs", "BrowserWindow");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/styled.tsx", "styled.section");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/google-analytics.ts", "gtag");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/contentful.ts", "createClient");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/paypal-client.ts", "loadScript");
    await expectGeneratedFile(result.projectDir, "apps/server/src/lib/openai.ts", "new OpenAI");
    await expectGeneratedFile(result.projectDir, "apps/server/src/lib/websocket.ts", "WebSocketServer");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/websocket.ts", "env.VITE_SERVER_URL");
    await expectGeneratedFile(result.projectDir, "apps/server/src/lib/paypal-server.ts", "new Client");
    await expectGeneratedFile(result.projectDir, "packages/auth/src/index.ts", "GitHubStrategy");
    await expectGeneratedFile(result.projectDir, "packages/auth/tsconfig.json", "tsconfig.base.json");
    expect(await readGenerated(result.projectDir, "apps/web/src/router.tsx")).not.toContain(
      'from "./routes/login"',
    );
    await expectGeneratedFile(
      result.projectDir,
      "apps/web/test/smoke.test.ts",
      'describe("web scaffold"',
    );
  });

  test("scaffolds a vanilla Vite app with OpenAPI generation and Capacitor", async () => {
    const result = await runTRPCTest(
      createCustomConfig({
        projectName: "typescript-library-expansion-vanilla",
        frontend: ["vanilla-vite"],
        backend: "hono",
        runtime: "node",
        api: "openapi",
        database: "none",
        orm: "none",
        addons: ["openapi-typescript", "capacitor"],
        cssFramework: "none",
        uiLibrary: "none",
      }),
    );

    expectSuccess(result);
    const webPackage = await readGenerated(result.projectDir, "apps/web/package.json");
    expect(webPackage).toContain("openapi-typescript");
    expect(webPackage).toContain("@capacitor/core");
    expect(webPackage).toContain("codegen:openapi");
    expect(webPackage).toContain("mobile:sync");
    await expectGeneratedFile(result.projectDir, "apps/web/src/main.ts", "querySelector");
    await expectGeneratedFile(result.projectDir, "apps/web/capacitor.config.ts", "CapacitorConfig");
  });

  test("scaffolds Vue with the Anthropic TypeScript SDK", async () => {
    const result = await runTRPCTest(
      createCustomConfig({
        projectName: "typescript-library-expansion-vue",
        frontend: ["vue"],
        backend: "express",
        runtime: "node",
        api: "openapi",
        database: "none",
        orm: "none",
        ai: "anthropic-sdk",
        cssFramework: "none",
        uiLibrary: "none",
      }),
    );

    expectSuccess(result);
    await expectGeneratedFile(result.projectDir, "apps/web/src/App.vue", "Better Fullstack");
    await expectGeneratedFile(result.projectDir, "apps/web/src/main.ts", 'from "vue"');
    await expectGeneratedFile(result.projectDir, "apps/server/src/lib/anthropic.ts", "new Anthropic");
    expect(await readGenerated(result.projectDir, "apps/server/package.json")).toContain(
      "@anthropic-ai/sdk",
    );
  });

  test("keeps self-hosted GraphQL and PayPal helpers on distinct, same-origin paths", async () => {
    const result = await runTRPCTest(
      createCustomConfig({
        projectName: "typescript-library-expansion-self",
        frontend: ["next"],
        backend: "self",
        runtime: "none",
        api: "graphql-yoga",
        database: "sqlite",
        orm: "drizzle",
        payments: "paypal",
        addons: ["graphql-codegen", "apollo-client"],
      }),
    );

    expectSuccess(result);
    const webPackage = await readGenerated(result.projectDir, "apps/web/package.json");
    expect(webPackage).toContain("@paypal/paypal-js");
    expect(webPackage).toContain("@paypal/paypal-server-sdk");
    await expectGeneratedFile(result.projectDir, "apps/web/codegen.ts", "api/graphql");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/apollo-client.ts", "/api/graphql");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/paypal-client.ts", "loadScript");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/paypal-server.ts", "new Client");
  });

  test("keeps prompt filtering and hard validation aligned for constrained libraries", () => {
    expect(resolveAIPrompt({ backend: "convex" }).options.map((option) => option.value)).not.toContain(
      "openai-sdk",
    );
    expect(
      resolvePaymentsPrompt({ backend: "convex", frontends: ["react-vite"] }).options.map(
        (option) => option.value,
      ),
    ).not.toContain("paypal");
    expect(resolveRealtimePrompt({ backend: "hono" }).options.map((option) => option.value)).not.toContain(
      "ws",
    );
    expect(
      resolveCSSFrameworkPrompt({ uiLibrary: "none", frontends: ["vue"] }).options.map(
        (option) => option.value,
      ),
    ).not.toContain("styled-components");

    const invalidConfigs = [
      { frontend: ["vue"], backend: "express", cssFramework: "styled-components" },
      { frontend: ["react-vite"], backend: "hono", realtime: "ws" },
      { frontend: ["react-vite"], backend: "convex", ai: "openai-sdk" },
      { frontend: ["react-vite"], backend: "convex", payments: "paypal" },
      {
        frontend: ["react-vite"],
        backend: "express",
        api: "openapi",
        addons: ["apollo-client"],
      },
    ] as const;

    for (const config of invalidConfigs) {
      expect(() =>
        runWithContext({ silent: true }, () => validateConfigForProgrammaticUse(config)),
      ).toThrow();
    }
  });

  test("adds the Contentful dependency whenever its web template is emitted", async () => {
    const result = await runTRPCTest(
      createCustomConfig({
        projectName: "typescript-library-expansion-contentful",
        frontend: ["angular"],
        backend: "express",
        runtime: "node",
        api: "none",
        database: "none",
        orm: "none",
        cms: "contentful",
      }),
    );

    expectSuccess(result);
    expect(await readGenerated(result.projectDir, "apps/web/package.json")).toContain("contentful");
    await expectGeneratedFile(result.projectDir, "apps/web/src/lib/contentful.ts", "createClient");
  });
});

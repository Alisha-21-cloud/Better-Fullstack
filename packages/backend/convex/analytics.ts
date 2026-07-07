import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";

type Dist = Record<string, number>;
type StackValue = string | boolean | string[];
type StackRecord = Record<string, StackValue>;
const DAY_MS = 24 * 60 * 60 * 1000;

// Legacy per-field aggregates kept for the existing getStats consumers.
// New stack options do NOT need to be added here: they are covered
// generically by `dimensions` (built from the event's `stack` record).
const SINGLE_FIELDS = [
  "ecosystem",
  "backend",
  "database",
  "orm",
  "api",
  "auth",
  "runtime",
  "dbSetup",
  "webDeploy",
  "serverDeploy",
  "payments",
  "email",
  "fileUpload",
  "astroIntegration",
  "cssFramework",
  "uiLibrary",
  "stateManagement",
  "forms",
  "animation",
  "validation",
  "realtime",
  "jobQueue",
  "caching",
  "logging",
  "observability",
  "ai",
  "cms",
  "testing",
  "effect",
  "rustWebFramework",
  "rustFrontend",
  "rustOrm",
  "rustApi",
  "rustCli",
  "packageManager",
  "platform",
] as const;
const MULTI_FIELDS = ["frontend", "addons", "examples", "rustLibraries"] as const;
const BOOL_FIELDS = ["git", "install"] as const;

type AnalyticsEvent = {
  creationTime: number;
  eventType?: string;
  source?: string;
  machineId?: string;
  success?: boolean;
  errorName?: string;
  setupFailures?: string[];
  durationMs?: number;
  fileCount?: number;
  stack?: StackRecord;
  options?: Record<string, string | string[]>;
  cli_version?: string;
  node_version?: string;
  git?: boolean;
  install?: boolean;
  frontend?: string[];
  addons?: string[];
  examples?: string[];
  rustLibraries?: string[];
} & { [K in (typeof SINGLE_FIELDS)[number]]?: string };

function inc(dist: Dist, key: string | undefined, by = 1): void {
  if (!key) return;
  dist[key] = (dist[key] ?? 0) + by;
}

function incAll(dist: Dist, keys: string[] | undefined): void {
  for (const key of keys ?? []) inc(dist, key);
}

function incBool(dist: Dist, val: boolean | undefined): void {
  if (val !== undefined) inc(dist, val ? "Yes" : "No");
}

function getMajorVersion(version: string | undefined): string | undefined {
  if (!version) return undefined;
  const clean = version.startsWith("v") ? version.slice(1) : version;
  return `v${clean.split(".")[0]}`;
}

function durationBucket(ms: number): string {
  if (ms < 5_000) return "<5s";
  if (ms < 15_000) return "5-15s";
  if (ms < 30_000) return "15-30s";
  if (ms < 60_000) return "30-60s";
  if (ms < 180_000) return "1-3m";
  return ">3m";
}

function isCreation(ev: { eventType?: string }): boolean {
  return ev.eventType === undefined || ev.eventType === "project_created";
}

/**
 * Whether the event counts as a real scaffolded project. Failed create
 * attempts only feed the envelope aggregates (outcomes, errorNames, …).
 * Historical rows predate `success` and stay counted.
 */
function isCountedProject(ev: { eventType?: string; success?: boolean }): boolean {
  return isCreation(ev) && ev.success !== false;
}

function utcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The full stack record for an event. New events carry it explicitly;
 * for rows from older CLI versions it is synthesized from the legacy
 * columns and the per-ecosystem `options` record so `dimensions` covers
 * history too.
 */
function eventStack(ev: AnalyticsEvent): StackRecord {
  if (ev.stack) return ev.stack;
  const s: StackRecord = {};
  for (const k of SINGLE_FIELDS) if (ev[k]) s[k] = ev[k] as string;
  for (const k of MULTI_FIELDS) if (ev[k]?.length) s[k] = ev[k] as string[];
  for (const k of BOOL_FIELDS) if (ev[k] !== undefined) s[k] = ev[k] as boolean;
  if (ev.options) Object.assign(s, ev.options);
  return s;
}

const LEGACY_KEYS: Set<string> = new Set([...SINGLE_FIELDS, ...MULTI_FIELDS, ...BOOL_FIELDS]);

/**
 * The per-ecosystem extras that feed the legacy `optionStats` aggregate.
 * Old events carry them in `options`; new events only send the generic
 * `stack`, so the non-legacy string fields are derived from it.
 */
function legacyOptions(ev: AnalyticsEvent): Record<string, string | string[]> {
  if (ev.options) return ev.options;
  const extras: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(ev.stack ?? {})) {
    if (LEGACY_KEYS.has(key) || typeof value === "boolean") continue;
    extras[key] = value;
  }
  return extras;
}

type StatsShape = {
  totalProjects: number;
  lastEventTime: number;
  nodeVersion: Dist;
  cliVersion: Dist;
  hourlyDistribution: Dist;
  stackCombinations: Dist;
  dbOrmCombinations: Dist;
  optionStats: Record<string, Dist>;
  dimensions: Record<string, Dist>;
  totalEvents: number;
  eventTypes: Dist;
  sources: Dist;
  outcomes: Dist;
  errorNames: Dist;
  setupFailureStats: Dist;
  durationBuckets: Dist;
  uniqueMachines: number;
  returningMachines: number;
  trackedMachineEvents: number;
} & { [K in (typeof SINGLE_FIELDS)[number]]: Dist } & {
  [K in (typeof MULTI_FIELDS)[number]]: Dist;
} & { [K in (typeof BOOL_FIELDS)[number]]: Dist };

function emptyStats(): StatsShape {
  const stats = {
    totalProjects: 0,
    lastEventTime: 0,
    nodeVersion: {},
    cliVersion: {},
    hourlyDistribution: {},
    stackCombinations: {},
    dbOrmCombinations: {},
    optionStats: {},
    dimensions: {},
    totalEvents: 0,
    eventTypes: {},
    sources: {},
    outcomes: {},
    errorNames: {},
    setupFailureStats: {},
    durationBuckets: {},
    uniqueMachines: 0,
    returningMachines: 0,
    trackedMachineEvents: 0,
  } as StatsShape;
  for (const k of [...SINGLE_FIELDS, ...MULTI_FIELDS, ...BOOL_FIELDS]) stats[k] = {};
  return stats;
}

/** Apply one event to the running aggregates (mutates `stats`). */
function applyEvent(stats: StatsShape, ev: AnalyticsEvent): void {
  const now = ev.creationTime;
  if (now > stats.lastEventTime) stats.lastEventTime = now;

  // Envelope aggregates: every event type.
  stats.totalEvents += 1;
  inc(stats.eventTypes, ev.eventType ?? "project_created");
  inc(stats.sources, ev.source ?? "unknown");
  inc(stats.outcomes, ev.success === undefined ? "unknown" : ev.success ? "success" : "failure");
  inc(stats.errorNames, ev.errorName);
  incAll(stats.setupFailureStats, ev.setupFailures);
  if (ev.durationMs !== undefined) inc(stats.durationBuckets, durationBucket(ev.durationMs));

  // Failed attempts stop here: no project or requested stack aggregates.
  if (ev.success === false) return;

  // Generic full-coverage dimensions. Creation events use bare category
  // names; add/update events are namespaced so they never skew stack stats.
  const prefix = isCreation(ev)
    ? ""
    : ev.eventType === "feature_added"
      ? "add."
      : ev.eventType === "stack_updated"
        ? "update."
        : `${ev.eventType}.`;
  for (const [key, value] of Object.entries(eventStack(ev))) {
    const dist = (stats.dimensions[prefix + key] ??= {});
    if (typeof value === "boolean") incBool(dist, value);
    else if (Array.isArray(value)) incAll(dist, value);
    else inc(dist, value);
  }

  if (!isCreation(ev)) return;

  // Legacy aggregates: successful creations only (matches historical semantics).
  stats.totalProjects += 1;
  for (const k of SINGLE_FIELDS) inc(stats[k], ev[k]);
  for (const k of MULTI_FIELDS) incAll(stats[k], ev[k]);
  for (const k of BOOL_FIELDS) incBool(stats[k], ev[k]);
  inc(stats.nodeVersion, getMajorVersion(ev.node_version));
  inc(stats.cliVersion, ev.cli_version);
  inc(stats.hourlyDistribution, String(new Date(now).getUTCHours()).padStart(2, "0"));
  inc(stats.stackCombinations, `${ev.backend || "none"} + ${ev.frontend?.[0] || "none"}`);
  inc(stats.dbOrmCombinations, `${ev.database || "none"} + ${ev.orm || "none"}`);
  for (const [category, value] of Object.entries(legacyOptions(ev))) {
    const dist = (stats.optionStats[category] ??= {});
    incAll(dist, Array.isArray(value) ? value : [value]);
  }
}

const stackValidator = v.record(v.string(), v.union(v.string(), v.boolean(), v.array(v.string())));

const eventArgs = {
  // Envelope
  eventType: v.optional(v.string()),
  source: v.optional(v.string()),
  machineId: v.optional(v.string()),
  success: v.optional(v.boolean()),
  errorName: v.optional(v.string()),
  setupFailures: v.optional(v.array(v.string())),
  durationMs: v.optional(v.number()),
  fileCount: v.optional(v.number()),
  // Full generic stack config
  stack: v.optional(stackValidator),
  // Legacy named fields (still sent by older CLI versions)
  ecosystem: v.optional(v.string()),
  database: v.optional(v.string()),
  orm: v.optional(v.string()),
  backend: v.optional(v.string()),
  runtime: v.optional(v.string()),
  frontend: v.optional(v.array(v.string())),
  api: v.optional(v.string()),
  auth: v.optional(v.string()),
  dbSetup: v.optional(v.string()),
  webDeploy: v.optional(v.string()),
  serverDeploy: v.optional(v.string()),
  addons: v.optional(v.array(v.string())),
  examples: v.optional(v.array(v.string())),
  payments: v.optional(v.string()),
  email: v.optional(v.string()),
  fileUpload: v.optional(v.string()),
  astroIntegration: v.optional(v.string()),
  cssFramework: v.optional(v.string()),
  uiLibrary: v.optional(v.string()),
  stateManagement: v.optional(v.string()),
  forms: v.optional(v.string()),
  animation: v.optional(v.string()),
  validation: v.optional(v.string()),
  realtime: v.optional(v.string()),
  jobQueue: v.optional(v.string()),
  caching: v.optional(v.string()),
  logging: v.optional(v.string()),
  observability: v.optional(v.string()),
  ai: v.optional(v.string()),
  cms: v.optional(v.string()),
  testing: v.optional(v.string()),
  effect: v.optional(v.string()),
  rustWebFramework: v.optional(v.string()),
  rustFrontend: v.optional(v.string()),
  rustOrm: v.optional(v.string()),
  rustApi: v.optional(v.string()),
  rustCli: v.optional(v.string()),
  rustLibraries: v.optional(v.array(v.string())),
  git: v.optional(v.boolean()),
  packageManager: v.optional(v.string()),
  install: v.optional(v.boolean()),
  cli_version: v.optional(v.string()),
  node_version: v.optional(v.string()),
  platform: v.optional(v.string()),
  options: v.optional(v.record(v.string(), v.union(v.string(), v.array(v.string())))),
};

export const ingestEvent = internalMutation({
  args: eventArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("analyticsEvents", args);
    const event = await ctx.db.get(id);
    const now = event!._creationTime;
    const today = utcDate(now);

    const existing = await ctx.db.query("analyticsStats").first();
    let stats: StatsShape;
    if (existing) {
      const { _id, _creationTime, ...plain } = existing;
      stats = { ...emptyStats(), ...plain } as StatsShape;
    } else {
      stats = emptyStats();
    }
    applyEvent(stats, { ...args, creationTime: now });

    // Machine tracking (anonymous random ID → uniques, new vs returning).
    let newMachine = false;
    if (args.machineId) {
      stats.trackedMachineEvents += 1;
      const machine = await ctx.db
        .query("analyticsMachines")
        .withIndex("by_machine_id", (q) => q.eq("machineId", args.machineId!))
        .first();
      if (machine) {
        if (machine.eventCount === 1) stats.returningMachines += 1;
        await ctx.db.patch("analyticsMachines", machine._id, {
          lastSeen: now,
          eventCount: machine.eventCount + 1,
          platform: args.platform ?? machine.platform,
          lastCliVersion: args.cli_version ?? machine.lastCliVersion,
        });
      } else {
        newMachine = true;
        stats.uniqueMachines += 1;
        await ctx.db.insert("analyticsMachines", {
          machineId: args.machineId,
          firstSeen: now,
          lastSeen: now,
          eventCount: 1,
          platform: args.platform,
          lastCliVersion: args.cli_version,
        });
      }
      const activity = await ctx.db
        .query("analyticsMachineDailyActivity")
        .withIndex("by_date_machine", (q) => q.eq("date", today).eq("machineId", args.machineId!))
        .first();
      if (activity) {
        await ctx.db.patch("analyticsMachineDailyActivity", activity._id, {
          eventCount: activity.eventCount + 1,
          lastSeen: now,
        });
      } else {
        await ctx.db.insert("analyticsMachineDailyActivity", {
          date: today,
          machineId: args.machineId,
          eventCount: 1,
          firstSeen: now,
          lastSeen: now,
        });
      }
    }

    if (existing) {
      await ctx.db.patch("analyticsStats", existing._id, stats);
    } else {
      await ctx.db.insert("analyticsStats", stats);
    }

    const creation = isCountedProject(args);
    const daily = await ctx.db
      .query("analyticsDailyStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    if (daily) {
      await ctx.db.patch("analyticsDailyStats", daily._id, {
        count: daily.count + (creation ? 1 : 0),
        newMachines: (daily.newMachines ?? 0) + (newMachine ? 1 : 0),
      });
    } else {
      await ctx.db.insert("analyticsDailyStats", {
        date: today,
        count: creation ? 1 : 0,
        newMachines: newMachine ? 1 : 0,
      });
    }

    return null;
  },
});

const distributionValidator = v.record(v.string(), v.number());

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("analyticsStats").first();
    if (!stats) return null;
    const { _id, _creationTime, ...plain } = stats;
    return {
      ...emptyStats(),
      ...plain,
      hourlyDistribution: stats.hourlyDistribution ?? {},
      stackCombinations: stats.stackCombinations ?? {},
      dbOrmCombinations: stats.dbOrmCombinations ?? {},
      optionStats: stats.optionStats ?? {},
      dimensions: stats.dimensions ?? {},
    };
  },
});

export const getDailyStats = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      count: v.number(),
      newMachines: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const now = Date.now();
    const today = utcDate(now);
    const cutoffDate = utcDate(now - (days - 1) * DAY_MS);

    const allDaily = await ctx.db
      .query("analyticsDailyStats")
      .withIndex("by_date", (q) => q.gte("date", cutoffDate))
      .order("asc")
      .collect();

    return allDaily
      .filter((d) => d.date >= cutoffDate && d.date <= today)
      .map((d) => ({ date: d.date, count: d.count, newMachines: d.newMachines }));
  },
});

export const getEngagement = query({
  args: {},
  returns: v.object({
    uniqueMachines: v.number(),
    returningMachines: v.number(),
    trackedEvents: v.number(),
    newMachinesLast30d: v.number(),
    activeMachinesLast30d: v.number(),
  }),
  handler: async (ctx) => {
    const stats = await ctx.db.query("analyticsStats").first();
    const now = Date.now();
    const today = utcDate(now);
    const cutoffDate = utcDate(now - 29 * DAY_MS);
    const daily = await ctx.db
      .query("analyticsDailyStats")
      .withIndex("by_date", (q) => q.gte("date", cutoffDate))
      .collect();
    const activity = await ctx.db
      .query("analyticsMachineDailyActivity")
      .withIndex("by_date", (q) => q.gte("date", cutoffDate))
      .collect();
    const activeMachines = new Set(
      activity.filter((event) => event.date <= today).map((event) => event.machineId),
    );
    return {
      uniqueMachines: stats?.uniqueMachines ?? 0,
      returningMachines: stats?.returningMachines ?? 0,
      trackedEvents: stats?.trackedMachineEvents ?? 0,
      newMachinesLast30d: daily
        .filter((event) => event.date <= today)
        .reduce((sum, event) => sum + (event.newMachines ?? 0), 0),
      activeMachinesLast30d: activeMachines.size,
    };
  },
});

export const getRecentEvents = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const events = await ctx.db
      .query("analyticsEvents")
      .order("desc")
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();
    return events.map(({ machineId: _machineId, ...event }) => event);
  },
});

export const backfillStats = mutation({
  args: {},
  returns: v.object({
    totalProcessed: v.number(),
    dailyDates: v.number(),
    uniqueMachines: v.number(),
  }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("analyticsStats").first();
    if (existing) {
      await ctx.db.delete("analyticsStats", existing._id);
    }
    for (const d of await ctx.db.query("analyticsDailyStats").collect()) {
      await ctx.db.delete("analyticsDailyStats", d._id);
    }
    for (const m of await ctx.db.query("analyticsMachines").collect()) {
      await ctx.db.delete("analyticsMachines", m._id);
    }
    for (const a of await ctx.db.query("analyticsMachineDailyActivity").collect()) {
      await ctx.db.delete("analyticsMachineDailyActivity", a._id);
    }

    const events = await ctx.db.query("analyticsEvents").collect();
    events.sort((a, b) => a._creationTime - b._creationTime);

    const stats = emptyStats();
    const dailyCounts = new Map<string, { count: number; newMachines: number }>();
    const machines = new Map<
      string,
      {
        firstSeen: number;
        lastSeen: number;
        eventCount: number;
        platform?: string;
        lastCliVersion?: string;
      }
    >();
    const machineActivity = new Map<
      string,
      { date: string; machineId: string; eventCount: number; firstSeen: number; lastSeen: number }
    >();

    for (const ev of events) {
      const now = ev._creationTime;
      applyEvent(stats, { ...ev, creationTime: now } as AnalyticsEvent);

      const date = utcDate(now);
      const daily = dailyCounts.get(date) ?? { count: 0, newMachines: 0 };
      if (isCountedProject(ev)) daily.count += 1;

      if (ev.machineId) {
        const activityKey = `${date}:${ev.machineId}`;
        const activity = machineActivity.get(activityKey);
        if (activity) {
          activity.eventCount += 1;
          activity.lastSeen = now;
        } else {
          machineActivity.set(activityKey, {
            date,
            machineId: ev.machineId,
            eventCount: 1,
            firstSeen: now,
            lastSeen: now,
          });
        }

        const machine = machines.get(ev.machineId);
        if (machine) {
          machine.lastSeen = now;
          machine.eventCount += 1;
          machine.platform = ev.platform ?? machine.platform;
          machine.lastCliVersion = ev.cli_version ?? machine.lastCliVersion;
        } else {
          daily.newMachines += 1;
          machines.set(ev.machineId, {
            firstSeen: now,
            lastSeen: now,
            eventCount: 1,
            platform: ev.platform,
            lastCliVersion: ev.cli_version,
          });
        }
      }
      dailyCounts.set(date, daily);
    }

    stats.uniqueMachines = machines.size;
    stats.returningMachines = [...machines.values()].filter((m) => m.eventCount > 1).length;
    stats.trackedMachineEvents = [...machines.values()].reduce((sum, m) => sum + m.eventCount, 0);
    if (stats.totalEvents > 0) {
      await ctx.db.insert("analyticsStats", stats);
    }
    for (const [date, { count, newMachines }] of dailyCounts) {
      await ctx.db.insert("analyticsDailyStats", { date, count, newMachines });
    }
    for (const [machineId, machine] of machines) {
      await ctx.db.insert("analyticsMachines", { machineId, ...machine });
    }
    for (const activity of machineActivity.values()) {
      await ctx.db.insert("analyticsMachineDailyActivity", activity);
    }

    return {
      totalProcessed: stats.totalEvents,
      dailyDates: dailyCounts.size,
      uniqueMachines: machines.size,
    };
  },
});

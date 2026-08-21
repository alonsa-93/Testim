import { describe, expect, it } from "vitest";
import { normalizeExperience } from "@/lib/experience-normalize";
import { emptyExperience, newLayerId, newSceneId, newTrackId } from "@/lib/experience";

/**
 * Phase 1 — normalizeExperience (docs/experience-audit.md §5.2, §22–23
 * במסמך התיקון). זו נקודת ההגנה המרכזית: קונפיגורציה פגומה חייבת
 * ליפול בחינניות, לעולם לא לזרוק.
 */
describe("normalizeExperience — backward compatibility (R7)", () => {
  it("returns undefined when the field is absent entirely", () => {
    expect(normalizeExperience(undefined)).toBeUndefined();
    expect(normalizeExperience(null)).toBeUndefined();
  });

  it("rejects primitives instead of crashing", () => {
    expect(normalizeExperience("not an object")).toBeUndefined();
    expect(normalizeExperience(42)).toBeUndefined();
  });
});

describe("normalizeExperience — no data loss when disabled (§53/§95)", () => {
  it("preserves scenes even when enabled=false", () => {
    const raw = {
      enabled: false,
      scenes: [{ id: "s1", name: "Hero", layers: [], tracks: [{ target: "hero-title", props: { opacity: [{ at: 0, value: 0 }] } }] }],
    };
    const result = normalizeExperience(raw);
    expect(result).toBeDefined();
    expect(result!.enabled).toBe(false);
    expect(result!.scenes).toHaveLength(1);
    expect(result!.scenes[0].tracks).toHaveLength(1);
  });

  it("defaults enabled to false when the field itself is present but empty", () => {
    const result = normalizeExperience({});
    expect(result).toBeDefined();
    expect(result!.enabled).toBe(false);
    expect(result!.scenes).toEqual([]);
  });
});

describe("normalizeExperience — scene/layer/track normalization", () => {
  it("fills a missing scene id deterministically and defaults composition to flow", () => {
    const result = normalizeExperience({ enabled: true, scenes: [{ name: "Intro" }] });
    expect(result!.scenes[0].id).toBe("scene-1");
    expect(result!.scenes[0].composition).toBe("flow");
    expect(result!.scenes[0].pinned).toBe(false);
  });

  it("defaults pinned to true for stage composition unless explicitly overridden", () => {
    const result = normalizeExperience({ enabled: true, scenes: [{ composition: "stage" }] });
    expect(result!.scenes[0].pinned).toBe(true);
  });

  it("de-duplicates colliding scene ids", () => {
    const result = normalizeExperience({
      enabled: true,
      scenes: [{ id: "s1" }, { id: "s1" }],
    });
    const ids = result!.scenes.map((s) => s.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("drops layers with an unknown type instead of crashing", () => {
    const result = normalizeExperience({
      enabled: true,
      scenes: [{ layers: [{ type: "text", content: {}, layout: {} }, { type: "video" }, { type: 42 }] }],
    });
    expect(result!.scenes[0].layers).toHaveLength(1);
    expect(result!.scenes[0].layers[0].type).toBe("text");
  });

  it("drops a track that references no valid animatable props", () => {
    const result = normalizeExperience({
      enabled: true,
      scenes: [{ tracks: [{ target: "hero-title", props: { notarealprop: [{ at: 0, value: 1 }] } }] }],
    });
    expect(result!.scenes[0].tracks).toHaveLength(0);
  });

  it("drops a track with no target", () => {
    const result = normalizeExperience({
      enabled: true,
      scenes: [{ tracks: [{ props: { opacity: [{ at: 0, value: 1 }] } }] }],
    });
    expect(result!.scenes[0].tracks).toHaveLength(0);
  });

  it("sorts out-of-order keyframes by 'at' and drops malformed ones", () => {
    const result = normalizeExperience({
      enabled: true,
      scenes: [
        {
          tracks: [
            {
              target: "hero-title",
              props: {
                opacity: [
                  { at: 0.8, value: 1 },
                  { at: 0.1, value: 0 },
                  { at: "bad", value: 1 },
                  { at: 0.5, value: NaN },
                ],
              },
            },
          ],
        },
      ],
    });
    const kfs = result!.scenes[0].tracks[0].props.opacity!;
    expect(kfs.map((k) => k.at)).toEqual([0.1, 0.8]);
  });

  it("clamps keyframe 'at' into [0,1]", () => {
    const result = normalizeExperience({
      enabled: true,
      scenes: [{ tracks: [{ target: "x", props: { opacity: [{ at: -1, value: 0 }, { at: 2, value: 1 }] } }] }],
    });
    const kfs = result!.scenes[0].tracks[0].props.opacity!;
    expect(kfs.map((k) => k.at)).toEqual([0, 1]);
  });

  it("normalizes durationVh: raw number, responsive object, or fallback default", () => {
    const numeric = normalizeExperience({ enabled: true, scenes: [{ durationVh: 300 }] });
    expect(numeric!.scenes[0].durationVh).toBe(300);

    const responsive = normalizeExperience({
      enabled: true,
      scenes: [{ durationVh: { base: 300, mobile: 150 } }],
    });
    expect(responsive!.scenes[0].durationVh).toEqual({ base: 300, mobile: 150 });

    const invalid = normalizeExperience({ enabled: true, scenes: [{ durationVh: "not a number" }] });
    expect(invalid!.scenes[0].durationVh).toBe(200);
  });

  it("normalizes settings with conservative defaults", () => {
    const result = normalizeExperience({ enabled: true, settings: { intensity: 5 } });
    expect(result!.settings.intensity).toBe(1); // clamped
    expect(result!.settings.defaultEasing).toBe("soft");
    expect(result!.settings.reducedMotion).toBe("static");
    expect(result!.settings.scrub).toBe(0); // MVP always 0, even if input says otherwise
  });

  it("forces scrub to 0 even if the raw input claims otherwise (MVP policy, §4.6)", () => {
    const result = normalizeExperience({ enabled: true, settings: { scrub: 0.5 } });
    expect(result!.settings.scrub).toBe(0);
  });
});

describe("lib/experience — id helpers (same convention as newBlockId)", () => {
  it("newSceneId / newLayerId / newTrackId produce stable, unique ids", () => {
    expect(newSceneId([])).toBe("scene-1");
    expect(newLayerId([], "text")).toBe("text-1");
    expect(newTrackId([])).toBe("track-1");
  });

  it("emptyExperience is enabled with zero scenes and passes normalization unchanged", () => {
    const empty = emptyExperience();
    expect(empty.enabled).toBe(true);
    expect(empty.scenes).toEqual([]);
    expect(normalizeExperience(empty)).toEqual(empty);
  });
});

/**
 * Milestone B1 (docs/scroll-experience-rebuild-audit.md §2.1): clip/color
 * round-trip תואם-לאחור. קריטי: דף/preset ישן בלי clip/color בכלל חייב
 * להמשיך להיטען זהה לחלוטין (round-trip idempotence) -- normalizeExperience
 * לא ממציא שדות חדשים כשלא התבקש.
 */
describe("normalizeExperience — clip/color (Milestone B1)", () => {
  it("round-trips clip (numeric) keyframes unchanged", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "S",
          tracks: [{ id: "t1", target: "hero-image", props: { clip: [{ at: 0, value: 0 }, { at: 1, value: 1 }] } }],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].props.clip).toEqual([{ at: 0, value: 0 }, { at: 1, value: 1 }]);
  });

  it("accepts valid hex color keyframes and uppercases them", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "S",
          tracks: [{ id: "t1", target: "cta", props: { color: [{ at: 0, value: "#000" }, { at: 1, value: "#ffffff" }] } }],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].props.color).toEqual([
      { at: 0, value: "#000" },
      { at: 1, value: "#FFFFFF" },
    ]);
  });

  it("silently drops a color keyframe with a non-hex value (e.g. a semantic token — not supported per architecture-decision-gate.md)", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "S",
          tracks: [{ id: "t1", target: "cta", props: { color: [{ at: 0, value: "primary" }, { at: 1, value: "#FFFFFF" }] } }],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].props.color).toEqual([{ at: 1, value: "#FFFFFF" }]);
  });

  it("drops a numeric-typed value on a color prop and a string-typed value on a numeric prop (type mismatch, not just format)", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "S",
          tracks: [
            {
              id: "t1",
              target: "cta",
              props: {
                color: [{ at: 0, value: 5 }], // number where a hex string is required
                opacity: [{ at: 0, value: "0.5" }], // string where a number is required
                // a valid prop so the track itself survives (an all-invalid track is
                // dropped entirely -- see the "no data-loss" test below for that case)
                scale: [{ at: 0, value: 1 }],
              },
            },
          ],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].props.color).toBeUndefined();
    expect(result!.scenes[0].tracks[0].props.opacity).toBeUndefined();
    expect(result!.scenes[0].tracks[0].props.scale).toEqual([{ at: 0, value: 1 }]);
  });

  it("drops the whole track when every prop on it is type-invalid (a track that writes nothing isn't a real track)", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "S",
          tracks: [{ id: "t1", target: "cta", props: { color: [{ at: 0, value: 5 }] } }],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks).toHaveLength(0);
  });

  it("an old page/preset with no clip/color at all still round-trips identically (backward compat)", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          name: "S",
          tracks: [{ id: "t1", target: "hero-title", props: { opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] } }],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].props).toEqual({ opacity: [{ at: 0, value: 0 }, { at: 1, value: 1 }] });
  });
});

/**
 * Milestone E1 (docs/rebuild-workplan.md אבן דרך E) — לפני התיקון,
 * `normalizeTrack` פשוט לא קרא בכלל את `raw.responsive`: טיוטה שמורה/
 * ייבוא JSON עם track.responsive.tablet/mobile היה מאבד את זה בשקט בכל
 * round-trip, למרות ש-evaluateTrack (lib/experience-interpolate.ts) כבר
 * ידע לצרוך את זה. ו-`hidden` הפך מ-boolean ל-Responsive<boolean>.
 */
describe("normalizeExperience — track.responsive + Responsive<boolean> hidden (Milestone E1)", () => {
  it("round-trips a track's tablet/mobile keyframe overrides (previously silently dropped)", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          tracks: [
            {
              id: "t1",
              target: "hero-title",
              props: { y: [{ at: 0, value: 60 }, { at: 1, value: -90 }] },
              responsive: {
                mobile: { y: [{ at: 0, value: 30 }, { at: 1, value: -30 }] },
              },
            },
          ],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].responsive).toEqual({
      mobile: { y: [{ at: 0, value: 30 }, { at: 1, value: -30 }] },
    });
  });

  it("drops an invalid keyframe inside a responsive override the same way it would in props (no second validation path)", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          tracks: [
            {
              id: "t1",
              target: "x",
              props: { opacity: [{ at: 0, value: 0 }] },
              responsive: { mobile: { opacity: [{ at: 0, value: "not-a-number" }] } },
            },
          ],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0].responsive).toBeUndefined();
  });

  it("omits `responsive` entirely (not an empty object) when there is nothing valid to carry", () => {
    const raw = {
      enabled: true,
      scenes: [
        {
          id: "s1",
          tracks: [{ id: "t1", target: "x", props: { opacity: [{ at: 0, value: 0 }] }, responsive: {} }],
        },
      ],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].tracks[0]).not.toHaveProperty("responsive");
  });

  it("round-trips a plain boolean `hidden` unchanged (backward compat with pre-E1 pages)", () => {
    const raw = {
      enabled: true,
      scenes: [{ id: "s1", layers: [{ id: "l1", type: "text", hidden: true }] }],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].layers[0].hidden).toBe(true);
  });

  it("round-trips a Responsive<boolean> object form of `hidden`", () => {
    const raw = {
      enabled: true,
      scenes: [{ id: "s1", layers: [{ id: "l1", type: "shape", hidden: { base: false, mobile: true } }] }],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].layers[0].hidden).toEqual({ base: false, mobile: true });
  });

  it("drops a malformed `hidden` value (neither boolean nor {base,...}) instead of letting it through", () => {
    const raw = {
      enabled: true,
      scenes: [{ id: "s1", layers: [{ id: "l1", type: "text", hidden: "yes" }] }],
    };
    const result = normalizeExperience(raw);
    expect(result!.scenes[0].layers[0]).not.toHaveProperty("hidden");
  });
});

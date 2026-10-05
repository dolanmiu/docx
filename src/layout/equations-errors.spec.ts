import { describe, expect, it, vi } from "vitest";

import type * as CambriaMath from "./cambria-math";
import { layOutEquation } from "./equations";

// Cambria Math's data without the widths and ink of its glyphs, so laying out a character fails as a mistake would
vi.mock("./cambria-math", async (original) => ({ ...(await original<typeof CambriaMath>()), GLYPH_METRICS: new Map() }));

describe("layOutEquation", () => {
    it("should throw an error that isn't why the layout stops, rather than give it as why", () => {
        expect(() => layOutEquation([{ "m:r": [{ "m:t": ["x"] }] }], 11)).to.throw(TypeError);
    });
});

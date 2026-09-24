import { describe, expect, it } from "vitest";

import { getConnectionSites } from "./connection-sites";
import { PRESET_SHAPE_GEOMETRY } from "../preset-shape/preset-shape-geometry";
import type { PresetShapeType } from "../preset-shape/preset-shape-type";

describe("getConnectionSites", () => {
    it("should find a rectangle's sites at the middle of each side, in OOXML order", () => {
        expect(getConnectionSites("rectangle", 1000, 500)).to.deep.equal([
            { x: 500, y: 0, angle: 270 },
            { x: 0, y: 250, angle: 180 },
            { x: 500, y: 500, angle: 90 },
            { x: 1000, y: 250, angle: 0 },
        ]);
    });

    it("should move sites with the shape's adjustments", () => {
        expect(getConnectionSites("chevron", 1000, 500)[1]).to.deep.equal({ x: 250, y: 250, angle: 180 });
        expect(getConnectionSites("chevron", 1000, 500, { adj: 20000 })[1]).to.deep.equal({ x: 100, y: 250, angle: 180 });
    });

    it("should have no sites for connectors and shapes without any", () => {
        expect(getConnectionSites("elbowConnector", 1000, 500)).to.deep.equal([]);
        expect(getConnectionSites("chartX", 1000, 500)).to.deep.equal([]);
    });

    it("should calculate every preset shape's sites", () => {
        for (const type of Object.keys(PRESET_SHAPE_GEOMETRY) as readonly PresetShapeType[]) {
            for (const site of getConnectionSites(type, 1200000, 600000)) {
                expect(Number.isFinite(site.x) && Number.isFinite(site.y) && Number.isFinite(site.angle), type).to.equal(true);
            }
        }
    });
});

import { describe, expect, it } from "vitest";

import { PRESET_SHAPE_GEOMETRY } from "./preset-shape-geometry";
import type { PresetShapeType } from "./preset-shape-type";
import { PRESET_SHAPE_ADJUSTMENTS, createShapeGuides } from "./shape-adjustments";

describe("createShapeGuides", () => {
    it("should write a percentage in thousandths of a percent", () => {
        expect(createShapeGuides("roundedRectangle", { cornerRadius: 30 })).to.deep.equal({ adj: 30000 });
    });

    it("should write angles in 60,000ths of a degree", () => {
        expect(createShapeGuides("pie", { startAngle: 0, endAngle: 270 })).to.deep.equal({ adj1: 0, adj2: 16200000 });
    });

    it("should map each adjustment to its own guide", () => {
        expect(
            createShapeGuides("roundedRectangularCallout", {
                pointerX: -20.833,
                pointerY: 62.5,
                cornerRadius: 16.667,
            }),
        ).to.deep.equal({ adj1: -20833, adj2: 62500, adj3: 16667 });
    });

    it("should halve lengths that the guide measures from the centre", () => {
        expect(createShapeGuides("rightArrowCallout", { shaftThickness: 20, headWidth: 50, headLength: 25, boxWidth: 60 })).to.deep.equal({
            adj1: 20000,
            adj2: 25000,
            adj3: 25000,
            adj4: 60000,
        });
        expect(createShapeGuides("star5", { innerRadius: 50 })).to.deep.equal({ adj: 25000 });
    });

    it("should write the remaining percentage for a stripe width", () => {
        expect(createShapeGuides("diagonalStripe", { stripeWidth: 30 })).to.deep.equal({ adj: 70000 });
    });

    it("should skip adjustments that are undefined", () => {
        expect(createShapeGuides("rightArrow", { shaftThickness: 40, headLength: undefined })).to.deep.equal({ adj1: 40000 });
    });

    it("should return no guides when there are no adjustments", () => {
        expect(createShapeGuides("roundedRectangle")).to.deep.equal({});
        expect(createShapeGuides("rectangle", {})).to.deep.equal({});
    });

    it("should throw on a name the shape does not have", () => {
        expect(() => createShapeGuides("rightArrow", { adj1: 50000 })).to.throw(
            'Invalid adjustment "adj1" for shape "rightArrow". Expected one of: shaftThickness, headLength',
        );
        expect(() => createShapeGuides("roundedRectangle", { toString: 1 })).to.throw('Invalid adjustment "toString"');
    });

    it("should throw on any adjustment for a shape without handles", () => {
        expect(() => createShapeGuides("rectangle", { cornerRadius: 10 })).to.throw(
            'Invalid adjustment "cornerRadius". Shape "rectangle" has no adjustments',
        );
    });

    it("should cover exactly the adjustment guides of each preset shape definition", () => {
        for (const [type, definition] of Object.entries(PRESET_SHAPE_GEOMETRY)) {
            // Guides such as `hf` and `vf` are fixed scale factors without handles, so they have no adjustments
            const guides = Object.keys(definition.defaults ?? {}).filter((guide) => guide.startsWith("adj"));
            const adjustments: Readonly<Record<string, { readonly guide: string }>> =
                PRESET_SHAPE_ADJUSTMENTS[type as keyof typeof PRESET_SHAPE_ADJUSTMENTS] ?? {};
            expect(
                Object.values(adjustments)
                    .map(({ guide }) => guide)
                    .toSorted(),
                type,
            ).to.deep.equal(guides.toSorted());
        }
        for (const type of Object.keys(PRESET_SHAPE_ADJUSTMENTS)) {
            expect(PRESET_SHAPE_GEOMETRY[type as PresetShapeType], type).to.not.equal(undefined);
        }
    });
});

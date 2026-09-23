import { describe, expect, it } from "vitest";

import { formatVmlShapeStyle } from "@file/vml";

import { WATERMARK_Z_INDEX, createWatermarkShapeStyle } from "./watermark-shape-style";

describe("createWatermarkShapeStyle", () => {
    it("should centre the shape on the margins behind the text and include the rotation", () => {
        expect(formatVmlShapeStyle(createWatermarkShapeStyle({ width: 527.85, height: 131.95, rotation: 315 }))).toBe(
            `position:absolute;margin-left:0;margin-top:0;width:527.85pt;height:131.95pt;rotation:315;z-index:${WATERMARK_Z_INDEX};mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin`,
        );
    });

    it("should omit the rotation when it is zero", () => {
        expect(formatVmlShapeStyle(createWatermarkShapeStyle({ width: 100, height: 50, rotation: 0 }))).not.toContain("rotation");
    });

    it("should omit the rotation when it is not given", () => {
        expect(formatVmlShapeStyle(createWatermarkShapeStyle({ width: 100, height: 50 }))).not.toContain("rotation");
    });
});

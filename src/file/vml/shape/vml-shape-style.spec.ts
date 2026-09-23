import { describe, expect, it } from "vitest";

import { formatVmlShapeStyle } from "./vml-shape-style";

describe("formatVmlShapeStyle", () => {
    it("should return undefined when no style is given", () => {
        expect(formatVmlShapeStyle(undefined)).toBeUndefined();
    });

    it("should map property names to their CSS-like keys in declaration order", () => {
        expect(
            formatVmlShapeStyle({
                position: "absolute",
                marginLeft: 0,
                marginTop: 0,
                width: "527.85pt",
                height: "131.95pt",
                rotation: 315,
                zIndex: -251657216,
                positionHorizontal: "center",
                positionHorizontalRelative: "margin",
                positionVertical: "center",
                positionVerticalRelative: "margin",
            }),
        ).toBe(
            "position:absolute;margin-left:0;margin-top:0;width:527.85pt;height:131.95pt;rotation:315;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin",
        );
    });

    it("should map every supported property", () => {
        expect(
            formatVmlShapeStyle({
                flip: "x",
                height: "1in",
                left: "2pt",
                marginBottom: 1,
                marginLeft: 2,
                marginRight: 3,
                marginTop: 4,
                positionHorizontal: "left",
                positionHorizontalRelative: "page",
                positionVertical: "absolute",
                positionVerticalRelative: "text",
                wrapDistanceBottom: 5,
                wrapDistanceLeft: 6,
                wrapDistanceRight: 7,
                wrapDistanceTop: 8,
                wrapEdited: true,
                wrapStyle: "square",
                position: "relative",
                rotation: 90,
                top: "3pt",
                visibility: "hidden",
                width: "4in",
                zIndex: "auto",
            }),
        ).toBe(
            "flip:x;height:1in;left:2pt;margin-bottom:1;margin-left:2;margin-right:3;margin-top:4;mso-position-horizontal:left;mso-position-horizontal-relative:page;mso-position-vertical:absolute;mso-position-vertical-relative:text;mso-wrap-distance-bottom:5;mso-wrap-distance-left:6;mso-wrap-distance-right:7;mso-wrap-distance-top:8;mso-wrap-edited:true;mso-wrap-style:square;position:relative;rotation:90;top:3pt;visibility:hidden;width:4in;z-index:auto",
        );
    });

    it("should skip properties whose value is undefined", () => {
        expect(formatVmlShapeStyle({ width: "10pt", height: undefined, rotation: undefined })).toBe("width:10pt");
    });
});

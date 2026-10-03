import { describe, expect, it } from "vitest";

import { readFrameProperties } from "./text-frames";

/** A frame's properties element, with its attributes */
const framePr = (attributes: Record<string, unknown>): object => ({ _attr: attributes });

describe("readFrameProperties", () => {
    it("should read a frame's size, place and distances from the text, in points", () => {
        const frame = readFrameProperties(
            framePr({
                "w:w": 4000,
                "w:h": 1000,
                "w:hRule": "exact",
                "w:x": 1000,
                "w:y": -3000,
                "w:hAnchor": "margin",
                "w:vAnchor": "page",
                "w:wrap": "around",
                "w:hSpace": 360,
                "w:vSpace": 288,
            }),
        );
        expect(frame).to.deep.include({
            width: 200,
            height: 50,
            heightRule: "exact",
            horizontal: { from: "margin", offset: 50 },
            vertical: { from: "page", offset: -150 },
            wrap: "around",
            across: 18,
            down: 14.4,
        });
    });

    it("should take a height with no rule as the least, as Word does, and a frame with no width as as wide as its text", () => {
        const frame = readFrameProperties(framePr({ "w:hAnchor": "text", "w:vAnchor": "text" }));
        // `word-frames.docx` FM1, FM2, FM17
        expect(frame).to.deep.include({
            height: 0,
            heightRule: "atLeast",
            horizontal: { from: "column", offset: 0 },
            vertical: { from: "paragraph", offset: 0 },
            across: 0,
            down: 0,
        });
        expect(frame).not.to.have.property("width");
        expect(frame).not.to.have.property("wrap");
        expect(readFrameProperties(framePr({ "w:w": 0, "w:hAnchor": "text", "w:vAnchor": "text" }))).not.to.have.property("width");
    });

    it("should read a frame lined up with what it is placed against", () => {
        expect(
            readFrameProperties(framePr({ "w:hAnchor": "page", "w:vAnchor": "margin", "w:xAlign": "outside", "w:yAlign": "bottom" })),
        ).to.deep.include({
            horizontal: { from: "page", align: "outside" },
            vertical: { from: "margin", align: "bottom" },
        });
    });

    it("should give frames with the same properties the same key, in any order, and others another", () => {
        const key = (attributes: Record<string, unknown>): unknown =>
            (readFrameProperties(framePr(attributes)) as { readonly key: string }).key;
        expect(key({ "w:hAnchor": "page", "w:vAnchor": "page", "w:w": 10 })).to.equal(
            key({ "w:w": 10, "w:vAnchor": "page", "w:hAnchor": "page" }),
        );
        expect(key({ "w:hAnchor": "page", "w:vAnchor": "page", "w:w": 10 })).not.to.equal(
            key({ "w:hAnchor": "page", "w:vAnchor": "page", "w:w": 20 }),
        );
    });

    it("should say why a frame placed or sized in a way not yet followed can't be laid out", () => {
        const anchored = { "w:hAnchor": "page", "w:vAnchor": "page" };
        expect(readFrameProperties(framePr({ "w:vAnchor": "page" }))).to.equal("a text frame that doesn't say what it is placed against");
        expect(readFrameProperties(framePr({ "w:hAnchor": "page" }))).to.equal("a text frame that doesn't say what it is placed against");
        expect(readFrameProperties(framePr({ ...anchored, "w:hAnchor": "cell" }))).to.equal(
            "a text frame placed against what isn't followed yet",
        );
        expect(readFrameProperties(framePr({ ...anchored, "w:yAlign": "inline" }))).to.equal(
            "a text frame lined up in a way not yet followed",
        );
        expect(readFrameProperties(framePr({ ...anchored, "w:hRule": "bogus" }))).to.equal(
            "a text frame of a height rule not yet followed",
        );
    });
});

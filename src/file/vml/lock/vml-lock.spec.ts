import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlLock } from "./vml-lock";

describe("createVmlLock", () => {
    it("should default the extension scope to edit", () => {
        const tree = new Formatter().format(createVmlLock());

        expect(tree).toStrictEqual({ "o:lock": { _attr: { "v:ext": "edit" } } });
    });

    it("should lock the aspect ratio of a picture", () => {
        const tree = new Formatter().format(createVmlLock({ aspectRatio: true }));

        expect(tree).toStrictEqual({ "o:lock": { _attr: { "v:ext": "edit", aspectratio: "t" } } });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(
            createVmlLock({
                extension: "view",
                position: true,
                selection: false,
                grouping: true,
                ungrouping: false,
                rotation: true,
                cropping: false,
                vertices: true,
                adjustHandles: false,
                text: true,
                aspectRatio: false,
                shapeType: true,
            }),
        );

        expect(tree).toStrictEqual({
            "o:lock": {
                _attr: {
                    "v:ext": "view",
                    position: "t",
                    selection: "f",
                    grouping: "t",
                    ungrouping: "f",
                    rotation: "t",
                    cropping: "f",
                    verticies: "t",
                    adjusthandles: "f",
                    text: "t",
                    aspectratio: "f",
                    shapetype: "t",
                },
            },
        });
    });
});

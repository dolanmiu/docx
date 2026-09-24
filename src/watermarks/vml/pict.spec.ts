import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BuilderElement } from "docx";

import { createPict } from "./pict";

describe("createPict", () => {
    it("should wrap VML children in a w:pict element in order", () => {
        const tree = new Formatter().format(
            createPict({ children: [new BuilderElement({ name: "v:shapetype" }), new BuilderElement({ name: "v:shape" })] }),
        );

        expect(tree).toStrictEqual({ "w:pict": [{ "v:shapetype": {} }, { "v:shape": {} }] });
    });
});

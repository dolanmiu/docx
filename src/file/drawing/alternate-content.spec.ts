import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BuilderElement } from "@file/xml-components";

import { createAlternateContent } from "./alternate-content";

describe("createAlternateContent", () => {
    it("should write the choice, with the namespace it requires, and the fallback", () => {
        const tree = new Formatter().format(
            createAlternateContent({
                requires: "wpc",
                choice: new BuilderElement({ name: "w:drawing" }),
                fallback: new BuilderElement({ name: "w:pict" }),
            }),
        );
        expect(tree).to.deep.equal({
            "mc:AlternateContent": [
                { "mc:Choice": [{ _attr: { Requires: "wpc" } }, { "w:drawing": {} }] },
                { "mc:Fallback": [{ "w:pict": {} }] },
            ],
        });
    });
});

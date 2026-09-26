import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";

import { createElement, createText, createValue } from "./chart-elements";

describe("chart elements", () => {
    it("should write an element's attributes in order, leaving out undefined ones, and its children", () => {
        expect(xml(new Formatter().format(createElement("c:numFmt", { formatCode: "0%", skipped: undefined, sourceLinked: 1 })))).to.equal(
            '<c:numFmt formatCode="0%" sourceLinked="1"/>',
        );
        expect(xml(new Formatter().format(createElement("c:layout")))).to.equal("<c:layout/>");
        expect(xml(new Formatter().format(createElement("c:scaling", {}, [createValue("c:orientation", "minMax")])))).to.equal(
            '<c:scaling><c:orientation val="minMax"/></c:scaling>',
        );
    });

    it("should write a boolean value as 1 or 0", () => {
        expect(xml(new Formatter().format(createValue("c:varyColors", true)))).to.equal('<c:varyColors val="1"/>');
        expect(xml(new Formatter().format(createValue("c:varyColors", false)))).to.equal('<c:varyColors val="0"/>');
        expect(xml(new Formatter().format(createValue("c:gapWidth", 219)))).to.equal('<c:gapWidth val="219"/>');
    });

    it("should write text, escaped", () => {
        expect(xml(new Formatter().format(createText("c:v", "Sales & <costs>")))).to.equal("<c:v>Sales &amp; &lt;costs&gt;</c:v>");
    });
});

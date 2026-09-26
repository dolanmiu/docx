import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createCategoriesAndValues, createDataSource, createSeriesStart, formatNumber } from "./series";

const toXml = (component: XmlComponent): string => xml(new Formatter().format(component));

describe("series", () => {
    it("should write numbers in JavaScript's shortest form that reads back as the same number", () => {
        expect([1, 0.5, 0.1 + 0.2, -0, 1e21, -2.5e-7].map(formatNumber)).to.deep.equal([
            "1",
            "0.5",
            "0.30000000000000004",
            "0",
            "1e+21",
            "-2.5e-7",
        ]);
    });

    it("should refer to text with a cache of each cell's text", () => {
        expect(toXml(createDataSource("c:cat", { type: "text", formula: "Sheet1!$A$2:$A$3", points: ["Jan", "Feb"] }))).to.equal(
            "<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$3</c:f><c:strCache>" +
                '<c:ptCount val="2"/><c:pt idx="0"><c:v>Jan</c:v></c:pt><c:pt idx="1"><c:v>Feb</c:v></c:pt>' +
                "</c:strCache></c:strRef></c:cat>",
        );
    });

    it("should refer to numbers with a cache that leaves out empty cells, so they are gaps, and counts every cell", () => {
        expect(toXml(createDataSource("c:val", { type: "number", formula: "Sheet1!$B$2:$B$4", points: [10, undefined, 0.5] }))).to.equal(
            "<c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f><c:numCache><c:formatCode>General</c:formatCode>" +
                '<c:ptCount val="3"/><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="2"><c:v>0.5</c:v></c:pt>' +
                "</c:numCache></c:numRef></c:val>",
        );
    });

    it("should start a series with its index, its order and a reference to its name", () => {
        const series = {
            name: { type: "text", formula: "Sheet1!$C$1", points: ["2025"] },
            categories: { type: "number", formula: "Sheet1!$A$2", points: [2024] },
            values: { type: "number", formula: "Sheet1!$C$2", points: [3] },
        } as const;

        expect(createSeriesStart(1, series).map(toXml)).to.deep.equal([
            '<c:idx val="1"/>',
            '<c:order val="1"/>',
            '<c:tx><c:strRef><c:f>Sheet1!$C$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>2025</c:v></c:pt></c:strCache></c:strRef></c:tx>',
        ]);
        expect(createCategoriesAndValues(series).map(toXml)).to.deep.equal([
            '<c:cat><c:numRef><c:f>Sheet1!$A$2</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="1"/><c:pt idx="0"><c:v>2024</c:v></c:pt></c:numCache></c:numRef></c:cat>',
            '<c:val><c:numRef><c:f>Sheet1!$C$2</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="1"/><c:pt idx="0"><c:v>3</c:v></c:pt></c:numCache></c:numRef></c:val>',
        ]);
    });
});

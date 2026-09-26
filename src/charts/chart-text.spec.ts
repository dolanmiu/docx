import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";

import { createAxisTitle, createChartTitle } from "./chart-text";

const TEXT_COLOR = '<a:solidFill><a:schemeClr val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr></a:solidFill>';
const FONTS = '<a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/>';
const BODY = (rotation: number): string =>
    `<a:bodyPr rot="${rotation}" spcFirstLastPara="1" vertOverflow="ellipsis" vert="horz" wrap="square" anchor="ctr" anchorCtr="1"/><a:lstStyle/>`;

describe("createChartTitle", () => {
    it("should write the title as Office does: 14 point text in the theme's body font, not over the plot", () => {
        const properties = `<a:pPr><a:defRPr sz="1400" b="0" i="0" u="none" strike="noStrike" kern="1200" spc="0" baseline="0">${TEXT_COLOR}${FONTS}</a:defRPr></a:pPr>`;
        expect(xml(new Formatter().format(createChartTitle("Sales")))).to.equal(
            "<c:title>" +
                `<c:tx><c:rich>${BODY(0)}<a:p>${properties}<a:r><a:rPr lang="en-US"/><a:t>Sales</a:t></a:r></a:p></c:rich></c:tx>` +
                '<c:overlay val="0"/>' +
                "<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>" +
                `<c:txPr>${BODY(0)}<a:p>${properties}<a:endParaRPr lang="en-US"/></a:p></c:txPr>` +
                "</c:title>",
        );
    });

    it("should write each line of the title as a paragraph", () => {
        const title = xml(new Formatter().format(createChartTitle("Sales\nby month")));
        expect(title.match(/<a:t>[^<]*<\/a:t>/g)).to.deep.equal(["<a:t>Sales</a:t>", "<a:t>by month</a:t>"]);
    });
});

describe("createAxisTitle", () => {
    it("should write 10 point text, reading from bottom to top on a vertical axis", () => {
        const vertical = xml(new Formatter().format(createAxisTitle("Units", true)));
        expect(vertical).to.contain(BODY(-5400000));
        expect(vertical).to.contain('<a:defRPr sz="1000" b="0" i="0" u="none" strike="noStrike" kern="1200" baseline="0">');
        expect(vertical).to.contain("<a:t>Units</a:t>");
        expect(xml(new Formatter().format(createAxisTitle("Month", false)))).to.contain(BODY(0));
    });
});

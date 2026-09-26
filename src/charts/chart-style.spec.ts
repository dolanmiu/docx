// cspell:ignore cmpd
import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import {
    createAxisLine,
    createAxisProperties,
    createChartAreaProperties,
    createChartTextProperties,
    createFilledSeriesProperties,
    createGridlines,
    createLineSeriesProperties,
    createMarker,
    createNoShapeProperties,
    createScatterSeriesProperties,
    createSeriesColor,
    createSliceProperties,
    createTextProperties,
} from "./chart-style";

const toXml = (component: XmlComponent): string => xml(new Formatter().format(component));

const ACCENT1 = '<a:schemeClr val="accent1"/>';
const FILL = `<a:solidFill>${ACCENT1}</a:solidFill>`;
const GRIDLINE = '<a:solidFill><a:schemeClr val="tx1"><a:lumMod val="15000"/><a:lumOff val="85000"/></a:schemeClr></a:solidFill>';

describe("createSeriesColor", () => {
    it("should colour the first six series with the theme's accents", () => {
        expect([0, 1, 5].map((index) => toXml(createSeriesColor(index)))).to.deep.equal([
            ACCENT1,
            '<a:schemeClr val="accent2"/>',
            '<a:schemeClr val="accent6"/>',
        ]);
    });

    it("should colour the next series with the accents, darker and lighter, as Office's colors1.xml does", () => {
        expect(toXml(createSeriesColor(6))).to.equal('<a:schemeClr val="accent1"><a:lumMod val="60000"/></a:schemeClr>');
        expect(toXml(createSeriesColor(13))).to.equal(
            '<a:schemeClr val="accent2"><a:lumMod val="80000"/><a:lumOff val="20000"/></a:schemeClr>',
        );
        expect(toXml(createSeriesColor(18))).to.equal('<a:schemeClr val="accent1"><a:lumMod val="80000"/></a:schemeClr>');
        expect(toXml(createSeriesColor(24))).to.equal(
            '<a:schemeClr val="accent1"><a:lumMod val="60000"/><a:lumOff val="40000"/></a:schemeClr>',
        );
        expect(toXml(createSeriesColor(30))).to.equal('<a:schemeClr val="accent1"><a:lumMod val="50000"/></a:schemeClr>');
        expect(toXml(createSeriesColor(36))).to.equal(
            '<a:schemeClr val="accent1"><a:lumMod val="70000"/><a:lumOff val="30000"/></a:schemeClr>',
        );
        expect(toXml(createSeriesColor(42))).to.equal('<a:schemeClr val="accent1"><a:lumMod val="70000"/></a:schemeClr>');
        expect(toXml(createSeriesColor(53))).to.equal(
            '<a:schemeClr val="accent6"><a:lumMod val="50000"/><a:lumOff val="50000"/></a:schemeClr>',
        );
        // Then they repeat
        expect(toXml(createSeriesColor(54))).to.equal(ACCENT1);
    });

    it("should use a colour given for the series instead", () => {
        expect(toXml(createSeriesColor(0, "#C00000"))).to.equal('<a:srgbClr val="C00000"/>');
        expect(toXml(createSeriesColor(3, { theme: "dark2", darker: 25 }))).to.equal(
            '<a:schemeClr val="dk2"><a:lumMod val="75000"/></a:schemeClr>',
        );
    });
});

describe("chart look", () => {
    it("should write no fill and no line", () => {
        expect(toXml(createNoShapeProperties())).to.equal("<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>");
    });

    it("should fill the chart area with the background colour, with a thin grey border", () => {
        expect(toXml(createChartAreaProperties())).to.equal(
            '<c:spPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill>' +
                `<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr">${GRIDLINE}<a:round/></a:ln><a:effectLst/></c:spPr>`,
        );
    });

    it("should fill bars and areas, with no line", () => {
        expect(toXml(createFilledSeriesProperties(createSeriesColor(0)))).to.equal(
            `<c:spPr>${FILL}<a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>`,
        );
    });

    it("should fill slices, with a 1.5 point border in the background colour", () => {
        expect(toXml(createSliceProperties(createSeriesColor(0)))).to.equal(
            `<c:spPr>${FILL}<a:ln w="19050"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln><a:effectLst/></c:spPr>`,
        );
    });

    it("should draw lines 2.25 points wide, with round ends and joins", () => {
        expect(toXml(createLineSeriesProperties(createSeriesColor(0)))).to.equal(
            `<c:spPr><a:ln w="28575" cap="rnd">${FILL}<a:round/></a:ln><a:effectLst/></c:spPr>`,
        );
    });

    it("should draw a scatter series' line 1.5 points wide, or none", () => {
        expect(toXml(createScatterSeriesProperties(createSeriesColor(0)))).to.equal(
            `<c:spPr><a:ln w="19050" cap="rnd">${FILL}<a:round/></a:ln><a:effectLst/></c:spPr>`,
        );
        expect(toXml(createScatterSeriesProperties(undefined))).to.equal(
            '<c:spPr><a:ln w="25400" cap="rnd"><a:noFill/><a:round/></a:ln><a:effectLst/></c:spPr>',
        );
    });

    it("should draw markers as circles of size 5 in the series' colour, or none", () => {
        expect(toXml(createMarker(() => createSeriesColor(0)))).to.equal(
            '<c:marker><c:symbol val="circle"/><c:size val="5"/>' +
                `<c:spPr>${FILL}<a:ln w="9525">${FILL}</a:ln><a:effectLst/></c:spPr></c:marker>`,
        );
        expect(toXml(createMarker(undefined))).to.equal('<c:marker><c:symbol val="none"/></c:marker>');
    });

    it("should draw gridlines and axis lines 0.75 points wide in grey, darker for scatter charts", () => {
        expect(toXml(createGridlines())).to.equal(
            `<c:majorGridlines><c:spPr><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr">${GRIDLINE}<a:round/></a:ln><a:effectLst/></c:spPr></c:majorGridlines>`,
        );
        expect(toXml(createAxisLine(25))).to.contain('<a:lumMod val="25000"/><a:lumOff val="75000"/>');
        expect(toXml(createAxisProperties(undefined))).to.equal("<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>");
    });

    it("should write text in the theme's body font, grey, with Office's automatic rotation", () => {
        expect(toXml(createTextProperties({ size: 9 }))).to.equal(
            "<c:txPr>" +
                '<a:bodyPr rot="-60000000" spcFirstLastPara="1" vertOverflow="ellipsis" vert="horz" wrap="square" anchor="ctr" anchorCtr="1"/>' +
                "<a:lstStyle/>" +
                '<a:p><a:pPr><a:defRPr sz="900" b="0" i="0" u="none" strike="noStrike" kern="1200" baseline="0">' +
                '<a:solidFill><a:schemeClr val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr></a:solidFill>' +
                '<a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/>' +
                '</a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p>' +
                "</c:txPr>",
        );
    });

    it("should write data labels' text with Office's margins, darker", () => {
        const labels = toXml(createTextProperties({ size: 9, color: 75, rotation: 0, labelMargins: true }));
        expect(labels).to.contain(
            '<a:bodyPr rot="0" spcFirstLastPara="1" vertOverflow="ellipsis" vert="horz" wrap="square" lIns="38100" tIns="19050" rIns="38100" bIns="19050" anchor="ctr" anchorCtr="1"><a:spAutoFit/></a:bodyPr>',
        );
        expect(labels).to.contain('<a:lumMod val="75000"/><a:lumOff val="25000"/>');
    });

    it("should write the chart's own text properties empty, as Office does", () => {
        expect(toXml(createChartTextProperties())).to.equal(
            '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr/></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>',
        );
    });
});

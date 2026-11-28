import { describe, expect, it } from "vitest";

import { createDrawingNumbering } from "./drawing-ids";

const idsOf = (xml: string, name: string): readonly number[] =>
    [...xml.matchAll(new RegExp(`<${name} id="(\\d+)"`, "g"))].map(([, id]) => Number(id));

const image = (id: number | string): string =>
    `<w:r><w:drawing><wp:inline distT="0"><wp:extent cx="1" cy="1"/><wp:docPr id="${id}" name=""/>` +
    `<a:graphic><a:graphicData><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name=""/></pic:nvPicPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

// A group of two shapes and a connector that joins them, as docx/shapes writes it
const group = (id: number, [first, second, connector]: readonly [number, number, number]): string =>
    `<w:r><w:drawing><wp:anchor distT="0"><wp:docPr id="${id}" name="Group"></wp:docPr><a:graphic><a:graphicData><wpg:wgp>` +
    `<wps:wsp><wps:cNvPr id="${first}" name="First"/></wps:wsp>` +
    `<wps:wsp><wps:cNvPr id="${second}" name="Second"/></wps:wsp>` +
    `<wps:wsp><wps:cNvPr id="${connector}" name="Connector"/><wps:cNvCnPr><a:stCxn id="${first}" idx="3"/><a:endCxn id="${second}" idx="1"/></wps:cNvCnPr></wps:wsp>` +
    `</wpg:wgp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`;

describe("createDrawingNumbering", () => {
    it("should number drawings from 1, in the order they are written", () => {
        const xml = createDrawingNumbering()(`<w:body><w:p>${image(40)}</w:p><w:p>${image(7)}${image(12)}</w:p></w:body>`);

        expect(idsOf(xml, "wp:docPr")).to.deep.equal([1, 2, 3]);
    });

    it("should carry on numbering in the parts after the first", () => {
        const numberDrawings = createDrawingNumbering();

        expect(idsOf(numberDrawings(`<w:p>${image(40)}${image(41)}</w:p>`), "wp:docPr")).to.deep.equal([1, 2]);
        expect(idsOf(numberDrawings(`<w:p>${image(42)}</w:p>`), "wp:docPr")).to.deep.equal([3]);
    });

    it("should start again from 1 for each document", () => {
        expect(idsOf(createDrawingNumbering()(image(40)), "wp:docPr")).to.deep.equal([1]);
        expect(idsOf(createDrawingNumbering()(image(41)), "wp:docPr")).to.deep.equal([1]);
    });

    it("should give a drawing that is in the document twice different ids", () => {
        expect(idsOf(createDrawingNumbering()(`<w:p>${image(5)}${image(5)}</w:p>`), "wp:docPr")).to.deep.equal([1, 2]);
    });

    it("should number the shapes in a drawing, and keep its connector joined to the same shapes", () => {
        const xml = createDrawingNumbering()(`<w:p>${image(9)}${group(20, [11, 12, 13])}</w:p>`);

        expect(xml).to.contain('<wp:docPr id="2" name="Group"></wp:docPr>');
        expect(xml).to.contain('<wps:cNvPr id="3" name="First"/>');
        expect(xml).to.contain('<wps:cNvPr id="4" name="Second"/>');
        expect(xml).to.contain('<wps:cNvPr id="5" name="Connector"/><wps:cNvCnPr><a:stCxn id="3" idx="3"/><a:endCxn id="4" idx="1"/>');
    });

    it("should keep a connector joined to shapes that come after it", () => {
        const connectorFirst = group(1, [2, 3, 4]).replace(
            /(<wpg:wgp>)(.*)(<wps:wsp><wps:cNvPr id="4".*<\/wps:wsp>)(<\/wpg:wgp>)/,
            "$1$3$2$4",
        );

        const xml = createDrawingNumbering()(connectorFirst);

        expect(xml).to.contain('<wps:cNvPr id="2" name="Connector"/><wps:cNvCnPr><a:stCxn id="3" idx="3"/><a:endCxn id="4" idx="1"/>');
        expect(xml).to.contain('<wps:cNvPr id="3" name="First"/>');
        expect(xml).to.contain('<wps:cNvPr id="4" name="Second"/>');
    });

    it("should join a connector to a shape, not to a drawing that had the same id", () => {
        const xml = createDrawingNumbering()(group(2, [2, 3, 4]));

        expect(idsOf(xml, "wp:docPr")).to.deep.equal([1]);
        expect(idsOf(xml, "wps:cNvPr")).to.deep.equal([2, 3, 4]);
        expect(xml).to.contain('<a:stCxn id="2" idx="3"/><a:endCxn id="3" idx="1"/>');
    });

    it("should leave the end of a connector that joins no shape in its drawing", () => {
        const xml = createDrawingNumbering()(group(1, [2, 3, 4]).replace('<a:endCxn id="3"', '<a:endCxn id="30"'));

        expect(xml).to.contain('<a:stCxn id="2" idx="3"/><a:endCxn id="30" idx="1"/>');
    });

    it("should number a drawing in a shape's text box as a drawing of its own", () => {
        const textBox =
            `<w:r><w:drawing><wp:inline><wp:docPr id="50" name=""/><a:graphic><wps:wsp><wps:cNvPr id="51" name=""/>` +
            `<wps:txbx><w:txbxContent><w:p>${group(52, [53, 54, 55])}</w:p></w:txbxContent></wps:txbx>` +
            `<wps:cNvCnPr><a:stCxn id="51" idx="0"/></wps:cNvCnPr></wps:wsp></a:graphic></wp:inline></w:drawing></w:r>`;

        const xml = createDrawingNumbering()(`<w:p>${textBox}${image(56)}</w:p>`);

        expect(
            [...xml.matchAll(/<(wp:docPr|wps:cNvPr|a:stCxn|a:endCxn) id="(\d+)"/g)].map(([, name, id]) => `${name} ${id}`),
        ).to.deep.equal([
            "wp:docPr 1",
            "wps:cNvPr 2",
            "wp:docPr 3",
            "wps:cNvPr 4",
            "wps:cNvPr 5",
            "wps:cNvPr 6",
            "a:stCxn 4",
            "a:endCxn 5",
            "a:stCxn 2",
            "wp:docPr 7",
        ]);
    });

    it("should number the pictures and groups in a group, and leave the id 0 of a picture's own properties", () => {
        const pictures =
            `<w:r><w:drawing><wp:inline><wp:docPr id="8" name=""/><a:graphic><a:graphicData><wpg:wgp>` +
            `<wpg:grpSp><wpg:cNvPr id="9" name=""/><pic:pic><pic:nvPicPr><pic:cNvPr id="10" name=""/></pic:nvPicPr></pic:pic></wpg:grpSp>` +
            `</wpg:wgp></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

        const xml = createDrawingNumbering()(`<w:p>${image(7)}${pictures}</w:p>`);

        expect(idsOf(xml, "wp:docPr")).to.deep.equal([1, 2]);
        expect(idsOf(xml, "wpg:cNvPr")).to.deep.equal([3]);
        expect(idsOf(xml, "pic:cNvPr")).to.deep.equal([0, 4]);
    });

    it("should find an id that isn't the first attribute, in XML written across lines", () => {
        const xml = `<w:p>\n    <w:r>\n        <w:drawing>\n            <wp:inline>\n                <wp:docPr name="" id="9"/>\n            </wp:inline>\n        </w:drawing>\n    </w:r>\n</w:p>`;

        expect(createDrawingNumbering()(xml)).to.equal(xml.replace('id="9"', 'id="1"'));
    });

    it("should change only the ids", () => {
        const xml = `<w:p>${image(9)}${group(20, [11, 12, 13])}</w:p>`;
        const withoutIds = (text: string): string => text.replace(/ id="\d+"/g, "");

        expect(withoutIds(createDrawingNumbering()(xml))).to.equal(withoutIds(xml));
    });

    it("should leave an id that isn't a number, ids outside drawings, and elements that only start with the same name", () => {
        const xml = `<w:p>${image("first")}<wps:cNvPr id="3" name=""/><wp:inlineThing><wp:docPrThing id="4"/></wp:inlineThing></w:p>`;

        expect(createDrawingNumbering()(xml)).to.equal(xml);
    });
});

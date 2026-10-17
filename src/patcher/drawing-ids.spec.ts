import { describe, expect, it } from "vitest";

import type { XmlElement as Element } from "@util/xml";

import { findDrawingIds, renumberDrawingsAvoiding } from "./drawing-ids";
import { toJson } from "./util";

const elementsOf = (xml: string): readonly Element[] => toJson(`<root>${xml}</root>`).elements![0].elements!;

const drawingIdsIn = (elements: readonly Element[]): readonly number[] => elements.flatMap(findDrawingIds);

const image = (id: number): string => `<w:r><w:drawing><wp:inline><wp:docPr id="${id}" name="Picture"/></wp:inline></w:drawing></w:r>`;

// A group of two shapes and a connector that joins them, as docx/shapes writes it
const group = (id: number, [first, second, connector]: readonly [number, number, number]): string =>
    `<w:r><w:drawing><wp:anchor><wp:positionH relativeFrom="column"><wp:posOffset>0</wp:posOffset></wp:positionH>` +
    `<wp:docPr id="${id}" name="Group"/><a:graphic><a:graphicData><wpg:wgp>` +
    `<wps:wsp><wps:cNvPr id="${first}" name="First"/></wps:wsp>` +
    `<wps:wsp><wps:cNvPr id="${second}" name="Second"/></wps:wsp>` +
    `<wps:wsp><wps:cNvPr id="${connector}" name="Connector"/><wps:cNvCnPr><a:stCxn id="${first}" idx="3"/><a:endCxn id="${second}" idx="1"/></wps:cNvCnPr></wps:wsp>` +
    `</wpg:wgp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`;

describe("drawing-ids", () => {
    describe("findDrawingIds", () => {
        it("should find the ids of drawings and of the shapes in them, at any depth", () => {
            const document = toJson(
                `<w:document><w:body><w:p>${image(4)}</w:p>` +
                    `<w:tbl><w:tr><w:tc><w:p>${group(1, [2, 3, 5])}</w:p></w:tc></w:tr></w:tbl></w:body></w:document>`,
            );

            expect(findDrawingIds(document)).to.deep.equal([4, 1, 2, 3, 5]);
        });

        it("should ignore other ids, such as a picture's, a connector's ends and a bookmark's", () => {
            const document = toJson(
                `<w:p><w:bookmarkStart w:id="1" w:name="a"/><pic:cNvPr id="2" name="Picture"/><a:stCxn id="3" idx="0"/></w:p>`,
            );

            expect(findDrawingIds(document)).to.deep.equal([]);
        });

        it("should ignore a drawing whose id is not a number", () => {
            expect(findDrawingIds(toJson(`<wp:docPr id="first" name="Picture"/>`))).to.deep.equal([]);
        });
    });

    describe("renumberDrawingsAvoiding", () => {
        it("should keep an id the document does not use", () => {
            const renumber = renumberDrawingsAvoiding([1, 2]);

            expect(drawingIdsIn(renumber(elementsOf(image(5))))).to.deep.equal([5]);
        });

        it("should give an id the document uses the next unused one", () => {
            const renumber = renumberDrawingsAvoiding([1, 4]);

            expect(drawingIdsIn(renumber(elementsOf(image(1))))).to.deep.equal([5]);
        });

        it("should give a drawing new ids each time it is inserted, so content inserted twice doesn't share them", () => {
            const renumber = renumberDrawingsAvoiding([]);

            const first = renumber(elementsOf(image(1)));
            const second = renumber(elementsOf(image(1)));

            expect(drawingIdsIn([...first, ...second])).to.deep.equal([1, 2]);
        });

        it("should give the same drawing twice in one insertion different ids", () => {
            const renumber = renumberDrawingsAvoiding([]);

            expect(drawingIdsIn(renumber(elementsOf(`<w:p>${image(1)}${image(1)}</w:p>`)))).to.deep.equal([1, 2]);
        });

        it("should renumber the shapes in a group, and the connector's ends with them", () => {
            const renumber = renumberDrawingsAvoiding([1, 2, 3]);

            const output = renumber(elementsOf(group(1, [2, 3, 4])));

            // 1, 2 and 3 are taken, and so is 4 once the group has it
            expect(output).to.deep.equal(elementsOf(group(4, [5, 6, 7])));
        });

        it("should renumber a connector's ends to the shapes it joins, even when the connector comes before them", () => {
            const renumber = renumberDrawingsAvoiding([1, 2, 3, 4]);
            const connectorFirst = (id: number, [first, second, connector]: readonly [number, number, number]): string =>
                `<w:r><w:drawing><wp:anchor><wp:docPr id="${id}" name="Group"/><wpg:wgp>` +
                `<wps:wsp><wps:cNvPr id="${connector}" name="Connector"/><wps:cNvCnPr><a:stCxn id="${first}" idx="3"/><a:endCxn id="${second}" idx="1"/></wps:cNvCnPr></wps:wsp>` +
                `<wps:wsp><wps:cNvPr id="${first}" name="First"/></wps:wsp><wps:wsp><wps:cNvPr id="${second}" name="Second"/></wps:wsp>` +
                `</wpg:wgp></wp:anchor></w:drawing></w:r>`;

            const output = renumber(elementsOf(connectorFirst(1, [2, 3, 4])));

            expect(output).to.deep.equal(elementsOf(connectorFirst(5, [7, 8, 6])));
        });

        it("should renumber a drawing in a shape's text box as a drawing of its own", () => {
            const renumber = renumberDrawingsAvoiding([1, 2, 3]);
            const xml =
                `<w:r><w:drawing><wp:anchor><wp:docPr id="1" name="Shape"/><wps:wsp><wps:cNvPr id="2" name="Box"/>` +
                `<wps:txbx><w:txbxContent><w:p>${image(2)}</w:p></w:txbxContent></wps:txbx>` +
                `</wps:wsp></wp:anchor></w:drawing></w:r>`;

            expect(drawingIdsIn(renumber(elementsOf(xml)))).to.deep.equal([4, 5, 6]);
        });

        it("should leave content without drawings as it is", () => {
            const renumber = renumberDrawingsAvoiding([1]);
            const elements = elementsOf(`<w:p><w:bookmarkStart w:id="1" w:name="a"/><w:r><w:t>A</w:t></w:r></w:p>`);

            expect(renumber(elements)).to.deep.equal(elements);
        });

        it("should not give a later drawing an id it already gave to a renumbered one", () => {
            // 1 is taken by the template, so becomes 3. The drawing that was 3 all along then needs a new id too
            const renumber = renumberDrawingsAvoiding([1, 2]);

            expect(drawingIdsIn(renumber(elementsOf(`${image(1)}${image(3)}`)))).to.deep.equal([3, 4]);
        });
    });
});

import { describe, expect, it } from "vitest";

import { type XmlElement as Element, stringifyElement } from "@util/xml";

import { toJson } from "./util";
import { findShapeTypeIds, removeShapeTypesIn } from "./vml-shape-types";

const elementsOf = (xml: string): readonly Element[] => toJson(`<root>${xml}</root>`).elements![0].elements!;

// The XML of elements, written as the patcher writes a part
const xmlOf = (elements: readonly Element[]): string => stringifyElement({ elements: [...elements] });

// The XML of an element, normalized as it is written
const normalized = (xml: string): string => xmlOf(elementsOf(xml));

// An embedded object, with the shape type of its picture frame when it is the first in its part
const object = (shapeType?: string): string =>
    `<w:r><w:object>${shapeType === undefined ? "" : `<v:shapetype id="${shapeType}"></v:shapetype>`}` +
    `<v:shape type="#_x0000_t75"></v:shape></w:object></w:r>`;

describe("vml-shape-types", () => {
    describe("findShapeTypeIds", () => {
        it("should find the id of every shape type, at any depth", () => {
            const document = toJson(
                `<w:document><w:body><w:p>${object("_x0000_t75")}</w:p>` +
                    `<w:tbl><w:tr><w:tc><w:p>${object("_x0000_t202")}</w:p></w:tc></w:tr></w:tbl></w:body></w:document>`,
            );

            expect(findShapeTypeIds(document)).toEqual(["_x0000_t75", "_x0000_t202"]);
        });
    });

    describe("removeShapeTypesIn", () => {
        it("should leave out a shape type the part has, and keep the shape that uses it", () => {
            const removeShapeTypes = removeShapeTypesIn(
                toJson(`<w:document><w:body><w:p>${object("_x0000_t75")}</w:p></w:body></w:document>`),
            );

            expect(xmlOf(removeShapeTypes(elementsOf(`<w:p>${object("_x0000_t75")}</w:p>`)))).toBe(normalized(`<w:p>${object()}</w:p>`));
        });

        it("should keep a shape type the part doesn't have, and leave it out of what is inserted after", () => {
            const removeShapeTypes = removeShapeTypesIn(
                toJson(`<w:document><w:body><w:p>${object("_x0000_t202")}</w:p></w:body></w:document>`),
            );

            expect(xmlOf(removeShapeTypes(elementsOf(`<w:p>${object("_x0000_t75")}</w:p>`)))).toBe(
                normalized(`<w:p>${object("_x0000_t75")}</w:p>`),
            );
            expect(xmlOf(removeShapeTypes(elementsOf(`<w:p>${object("_x0000_t75")}</w:p>`)))).toBe(normalized(`<w:p>${object()}</w:p>`));
        });

        it("should leave content without shape types as it is", () => {
            const removeShapeTypes = removeShapeTypesIn(
                toJson(`<w:document><w:body><w:p>${object("_x0000_t75")}</w:p></w:body></w:document>`),
            );
            const elements = elementsOf(`<w:p><w:r><w:t>Text</w:t></w:r></w:p>`);

            expect(removeShapeTypes(elements)).toEqual(elements);
        });
    });
});

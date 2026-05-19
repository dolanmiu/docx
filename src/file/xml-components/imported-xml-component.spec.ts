import { beforeEach, describe, expect, it } from "vitest";
import { type Element, xml2js } from "xml-js";

import { EMPTY_OBJECT } from "@file/xml-components";

import type { IContext } from "./base";
import { ImportedRootElementAttributes, ImportedXmlComponent, convertToXmlComponent } from "./imported-xml-component";

const xmlString = `
        <w:p w:one="value 1" w:two="value 2">
            <w:rPr>
                <w:noProof>some value</w:noProof>
            </w:rPr>
            <w:r active="true">
                <w:t>Text 1</w:t>
            </w:r>
            <w:r active="true">
                <w:t>Text 2</w:t>
            </w:r>
        </w:p>
    `;

const convertedXmlElement = {
    root: [
        {
            rootKey: "w:p",
            root: [
                { rootKey: "_attr", root: { "w:one": "value 1", "w:two": "value 2" } },
                { rootKey: "w:rPr", root: [{ rootKey: "w:noProof", root: ["some value"] }] },
                {
                    rootKey: "w:r",
                    root: [
                        { rootKey: "_attr", root: { active: "true" } },
                        { rootKey: "w:t", root: ["Text 1"] },
                    ],
                },
                {
                    rootKey: "w:r",
                    root: [
                        { rootKey: "_attr", root: { active: "true" } },
                        { rootKey: "w:t", root: ["Text 2"] },
                    ],
                },
            ],
        },
    ],
};

describe("ImportedXmlComponent", () => {
    let importedXmlComponent: ImportedXmlComponent;

    beforeEach(() => {
        const attributes = {
            someAttr: "1",
            otherAttr: "2",
        };
        importedXmlComponent = new ImportedXmlComponent("w:test", attributes);

        importedXmlComponent.push(new ImportedXmlComponent("w:child"));
    });

    describe("#prepForXml()", () => {
        it("should transform for xml", () => {
            const converted = importedXmlComponent.prepForXml({ stack: [] } as unknown as IContext);
            expect(JSON.parse(JSON.stringify(converted))).to.deep.equal({
                "w:test": [
                    {
                        _attr: {
                            someAttr: "1",
                            otherAttr: "2",
                        },
                    },
                    {
                        "w:child": EMPTY_OBJECT,
                    },
                ],
            });
        });
    });

    it("should create XmlComponent from xml string", () => {
        const converted = ImportedXmlComponent.fromXmlString(xmlString);
        expect(JSON.parse(JSON.stringify(converted))).to.deep.equal(convertedXmlElement);
    });

    describe("convertToXmlComponent", () => {
        it("should convert to xml component", () => {
            const xmlObj = xml2js(xmlString, { compact: false }) as Element;
            const converted = convertToXmlComponent(xmlObj);
            expect(JSON.parse(JSON.stringify(converted))).to.deep.equal(convertedXmlElement);
        });

        it("should return undefined if xml type is invalid", () => {
            const xmlObj = { type: "invalid" } as Element;
            const converted = convertToXmlComponent(xmlObj);
            expect(converted).to.equal(undefined);
        });

        it("should skip child elements that return undefined", () => {
            const xmlObj: Element = {
                type: "element",
                name: "w:p",
                elements: [
                    { type: "text", text: "hello" },
                    { type: "comment", comment: "a comment" } as unknown as Element,
                    { type: "element", name: "w:r", elements: [] },
                ],
            };
            const converted = convertToXmlComponent(xmlObj);
            expect(converted).not.to.equal(undefined);
            // The comment child should be skipped (returns undefined)
            // We should have text and w:r but not the comment
            const json = JSON.parse(JSON.stringify(converted));
            expect(json.root).to.have.length(2);
        });
    });
});

describe("ImportedRootElementAttributes", () => {
    let attributes: ImportedRootElementAttributes;

    beforeEach(() => {
        attributes = new ImportedRootElementAttributes({});
    });

    describe("#prepForXml()", () => {
        it("should work", () => {
            const converted = attributes.prepForXml({} as IContext);
            expect(converted).to.deep.equal({
                _attr: {},
            });
        });
    });
});

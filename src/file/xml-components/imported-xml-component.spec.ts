import { beforeEach, describe, expect, it } from "vitest";
import { Element, xml2js } from "xml-js";

import { EMPTY_OBJECT } from "@file/xml-components";

import { IContext } from "./base";
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

import { expect } from "chai";
import { Element, xml2js } from "xml-js";

import { ImportedXmlComponent } from "./";
import { convertToXmlComponent } from "./imported-xml-component";

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
    deleted: false,
    root: [
        {
            deleted: false,
            rootKey: "w:p",
            root: [
                { deleted: false, rootKey: "w:rPr", root: [{ deleted: false, rootKey: "w:noProof", root: ["some value"] }] },
                { deleted: false, rootKey: "w:r", root: [{ deleted: false, rootKey: "w:t", root: ["Text 1"] }], _attr: { active: "true" } },
                { deleted: false, rootKey: "w:r", root: [{ deleted: false, rootKey: "w:t", root: ["Text 2"] }], _attr: { active: "true" } },
            ],
            _attr: { "w:one": "value 1", "w:two": "value 2" },
        },
    ],
    rootKey: undefined,
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
            const converted = importedXmlComponent.prepForXml();
            expect(converted).to.eql({
                "w:test": [
                    {
                        _attr: {
                            someAttr: "1",
                            otherAttr: "2",
                        },
                    },
                    {
                        "w:child": [],
                    },
                ],
            });
        });
    });

    it("should create XmlComponent from xml string", () => {
        const converted = ImportedXmlComponent.fromXmlString(xmlString);
        expect(converted).to.eql(convertedXmlElement);
    });

    describe("convertToXmlComponent", () => {
        it("should convert to xml component", () => {
            const xmlObj = xml2js(xmlString, { compact: false }) as Element;
            const converted = convertToXmlComponent(xmlObj);
            expect(converted).to.eql(convertedXmlElement);
        });
    });
});

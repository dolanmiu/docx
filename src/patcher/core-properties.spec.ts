/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import { describe, expect, it } from "vitest";

import { Packer } from "@export/packer/packer";
import { File } from "@file/file";
import { Paragraph } from "@file/paragraph";
import { textOf, unzip, zip } from "tests/zip";

import { type PatchDocumentProperties, patchDocument } from "./from-docx";

const CONTENT_TYPES = `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>`;
const DOCUMENT = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>`;
const CORE_PROPERTIES_RELATIONSHIP_TYPE = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties";

const patch = async (data: Uint8Array, properties?: PatchDocumentProperties): Promise<ReadonlyMap<string, Uint8Array>> =>
    unzip(await patchDocument({ outputType: "nodebuffer", data, patches: {}, properties }));

// A template whose package relationships name its core properties part, at the path given
const templateWithCoreProperties = (path: string, core: string | Uint8Array): Uint8Array =>
    zip({
        "[Content_Types].xml": CONTENT_TYPES,
        "word/document.xml": DOCUMENT,
        "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="${path}"/></Relationships>`,
        [path]: core,
    });

// Text in UTF-16, with its byte order mark
const utf16 = (text: string, byteOrder: "little" | "big"): Uint8Array => {
    const bytes = new Uint8Array(2 + text.length * 2);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, 0xfeff, byteOrder === "little");
    for (let i = 0; i < text.length; i++) {
        view.setUint16(2 + i * 2, text.charCodeAt(i), byteOrder === "little");
    }
    return bytes;
};

const corePropertiesOf = (files: ReadonlyMap<string, Uint8Array>, path = "docProps/core.xml"): string => textOf(files, path) ?? "";

describe("patchDocument's properties", () => {
    it("should replace the template's properties with the given ones", async () => {
        const template = await Packer.toBuffer(
            new File({ title: "Draft", keywords: "old", description: "To do", sections: [{ children: [new Paragraph("Hello")] }] }),
        );
        const core = corePropertiesOf(
            await patch(template, { title: "Quarterly report", keywords: "finance, Q3", description: "Final version" }),
        );

        expect(core).to.contain("<dc:title>Quarterly report</dc:title>");
        expect(core).to.contain("<cp:keywords>finance, Q3</cp:keywords>");
        expect(core).to.contain("<dc:description>Final version</dc:description>");
        expect(core).not.to.contain("Draft");
        expect(core).not.to.contain("old");
        expect(core).not.to.contain("To do");
    });

    it("should keep the template's other properties, such as its author and dates", async () => {
        const template = await Packer.toBuffer(new File({ creator: "Ada", sections: [{ children: [] }] }));
        const before = corePropertiesOf(unzip(template));
        const core = corePropertiesOf(await patch(template, { title: "Report" }));

        expect(core).to.contain("<dc:creator>Ada</dc:creator>");
        expect(core).to.contain(before.match(/<dcterms:created[^>]*>[^<]*<\/dcterms:created>/)![0]);
        expect(core).to.contain(before.match(/<dcterms:modified[^>]*>[^<]*<\/dcterms:modified>/)![0]);
    });

    it("should add the properties the template doesn't have, each in its namespace", async () => {
        const template = await Packer.toBuffer(new File({ sections: [{ children: [] }] }));
        const core = corePropertiesOf(
            await patch(template, {
                title: "Report",
                subject: "Sales",
                creator: "Ada",
                keywords: "finance",
                description: "Final",
                lastModifiedBy: "Grace",
                revision: 3,
            }),
        );

        expect(core).to.contain("<dc:title>Report</dc:title>");
        expect(core).to.contain("<dc:subject>Sales</dc:subject>");
        expect(core).to.contain("<dc:creator>Ada</dc:creator>");
        expect(core).to.contain("<cp:keywords>finance</cp:keywords>");
        expect(core).to.contain("<dc:description>Final</dc:description>");
        expect(core).to.contain("<cp:lastModifiedBy>Grace</cp:lastModifiedBy>");
        expect(core).to.contain("<cp:revision>3</cp:revision>");
    });

    it("should clear a property given an empty value", async () => {
        const template = await Packer.toBuffer(new File({ title: "Draft", sections: [{ children: [] }] }));
        const core = corePropertiesOf(await patch(template, { title: "" }));

        expect(core).to.contain("<dc:title/>");
        expect(core).not.to.contain("Draft");
    });

    it("should escape the values", async () => {
        const template = await Packer.toBuffer(new File({ sections: [{ children: [] }] }));
        const core = corePropertiesOf(await patch(template, { title: "R&D <draft>" }));

        expect(core).to.contain("<dc:title>R&amp;D &lt;draft&gt;</dc:title>");
    });

    it("should replace keywords given in several languages", async () => {
        const template = zip({
            "[Content_Types].xml": CONTENT_TYPES,
            "word/document.xml": DOCUMENT,
            "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="docProps/core.xml"/></Relationships>`,
            "docProps/core.xml": `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"><cp:keywords>a<cp:value xml:lang="fr">b</cp:value></cp:keywords></cp:coreProperties>`,
        });
        const core = corePropertiesOf(await patch(template, { keywords: "c" }));

        expect(core).to.contain("<cp:keywords>c</cp:keywords>");
    });

    it("should use the prefixes the template gives the namespaces, and the part its relationships name", async () => {
        const template = zip({
            "[Content_Types].xml": CONTENT_TYPES,
            "word/document.xml": DOCUMENT,
            "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="/metadata/core.xml"/></Relationships>`,
            "metadata/core.xml": `<coreProperties xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dublin="http://purl.org/dc/elements/1.1/">\n  <dublin:title>Draft</dublin:title>\n</coreProperties>`,
        });
        const output = await patch(template, { title: "Report", subject: "Sales", keywords: "finance" });
        const core = corePropertiesOf(output, "metadata/core.xml");

        expect(core).to.contain("<dublin:title>Report</dublin:title>");
        expect(core).to.contain("<dublin:subject>Sales</dublin:subject>");
        expect(core).to.contain("<keywords>finance</keywords>");
        expect(output.has("docProps/core.xml")).to.equal(false);
    });

    it("should declare a namespace that the template's core properties don't have", async () => {
        const template = zip({
            "[Content_Types].xml": CONTENT_TYPES,
            "word/document.xml": DOCUMENT,
            "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="docProps/core.xml"/></Relationships>`,
            "docProps/core.xml": `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"/>`,
        });
        const core = corePropertiesOf(await patch(template, { title: "Report" }));

        expect(core).to.contain(`xmlns:dc="http://purl.org/dc/elements/1.1/"`);
        expect(core).to.contain("<dc:title>Report</dc:title>");
    });

    it("should add core properties to a template without them, with their relationship and content type", async () => {
        const template = zip({
            "[Content_Types].xml": CONTENT_TYPES,
            "word/document.xml": DOCUMENT,
            "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
        });
        const output = await patch(template, { title: "Report" });

        expect(corePropertiesOf(output)).to.contain(
            `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Report</dc:title></cp:coreProperties>`,
        );
        expect(textOf(output, "_rels/.rels")).to.contain(
            `<Relationship Id="rId2" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="docProps/core.xml"/>`,
        );
        expect(textOf(output, "[Content_Types].xml")).to.contain(
            `<Override ContentType="application/vnd.openxmlformats-package.core-properties+xml" PartName="/docProps/core.xml"/>`,
        );
    });

    it("should add the package's relationships to a template without them", async () => {
        const template = zip({ "[Content_Types].xml": CONTENT_TYPES, "word/document.xml": DOCUMENT });
        const output = await patch(template, { title: "Report" });

        expect(textOf(output, "_rels/.rels")).to.contain(
            `<Relationship Id="rId1" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="docProps/core.xml"/>`,
        );
        expect(corePropertiesOf(output)).to.contain("<dc:title>Report</dc:title>");
    });

    it.each(["little", "big"] as const)(
        "should set the properties of a template whose core properties are in UTF-16, %s-endian, and write them in UTF-8",
        async (byteOrder) => {
            const core = `<?xml version="1.0" encoding="UTF-16" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Draft</dc:title><dc:creator>Ada</dc:creator></cp:coreProperties>`;
            const output = await patch(templateWithCoreProperties("docProps/core.xml", utf16(core, byteOrder)), { title: "Report" });

            expect(corePropertiesOf(output)).to.equal(
                `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Report</dc:title><dc:creator>Ada</dc:creator></cp:coreProperties>`,
            );
        },
    );

    it("should set the properties of a core properties part whose name doesn't end in .xml", async () => {
        const core = `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Draft</dc:title></cp:coreProperties>`;
        const output = await patch(templateWithCoreProperties("docProps/core.props", core), { title: "Report" });

        expect(corePropertiesOf(output, "docProps/core.props")).to.contain("<dc:title>Report</dc:title>");
    });

    it("should throw if the template's core properties part has no core properties", async () => {
        const template = zip({
            "[Content_Types].xml": CONTENT_TYPES,
            "word/document.xml": DOCUMENT,
            "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${CORE_PROPERTIES_RELATIONSHIP_TYPE}" Target="docProps/core.xml"/></Relationships>`,
            "docProps/core.xml": "",
        });

        await expect(patch(template, { title: "Report" })).rejects.toThrow("Could not find the core properties in docProps/core.xml");
    });

    it("should set only the properties of options with others, such as a Document's", async () => {
        const options = { title: "Report", subject: undefined, sections: [] };
        const template = await Packer.toBuffer(new File({ subject: "Sales", sections: [{ children: [] }] }));
        const core = corePropertiesOf(await patch(template, options));

        expect(core).to.contain("<dc:title>Report</dc:title>");
        expect(core).to.contain("<dc:subject>Sales</dc:subject>");
        expect(core).not.to.contain("sections");
    });

    it("should leave the template's properties as they are without any", async () => {
        const template = await Packer.toBuffer(new File({ title: "Draft", sections: [{ children: [] }] }));

        expect(corePropertiesOf(await patch(template))).to.contain("<dc:title>Draft</dc:title>");
        expect(corePropertiesOf(await patch(template, {}))).to.contain("<dc:title>Draft</dc:title>");
    });
});

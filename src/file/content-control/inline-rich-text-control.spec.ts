/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { TextRun } from "../paragraph";
import { InlineRichTextContentControl } from "./inline-rich-text-control";
import { RunContentControl } from "./run-content-control";

// Mock context for XML validation
type MockContext = {
    readonly stack: readonly unknown[];
    readonly file: unknown;
    readonly viewWrapper: unknown;
};
const mockContext: MockContext = { stack: [], file: {}, viewWrapper: {} };

// Type definitions for XML structure
type XmlAttribute = {
    readonly "w:val": string;
};

type XmlElement = {
    readonly _attr?: XmlAttribute;
    readonly [key: string]: unknown;
};

type SdtElement = {
    readonly "w:tag"?: XmlElement;
    readonly "w:alias"?: XmlElement;
    readonly "w:richText"?: XmlElement;
    readonly "w:id"?: XmlElement;
    readonly [key: string]: unknown;
};

type XmlTree = {
    readonly "w:sdt": readonly {
        readonly "w:sdtPr": readonly SdtElement[];
        readonly [key: string]: unknown;
    }[];
    readonly [key: string]: unknown;
};

describe("InlineRichTextContentControl", () => {
    beforeEach(() => {
        // Mock the numeric ID creator to return a predictable function
        vi.spyOn(convenienceFunctions, "uniqueNumericIdCreator").mockReturnValue(() => 111222333);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const control = new InlineRichTextContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });
            const stringifiedJson = JSON.stringify(control);

            // Should not throw
            expect(() => JSON.parse(stringifiedJson)).not.toThrow();
        });

        it("should throw error for empty tag", () => {
            expect(
                () =>
                    new InlineRichTextContentControl({
                        tag: "", // Empty tag should throw validation error
                        children: [new TextRun("Test")],
                    }),
            ).toThrow("InlineRichTextContentControl options.tag: Tag is required and cannot be empty");
        });

        it("should throw error for missing children", () => {
            expect(
                () =>
                    new InlineRichTextContentControl({
                        tag: "ValidTag",
                        // @ts-expect-error Testing invalid type
                        children: undefined,
                    }),
            ).toThrow("InlineRichTextContentControl options.children: Children array is required");
        });
    });

    describe("#prepForXml()", () => {
        it("should generate correct basic OOXML structure", () => {
            const control = new InlineRichTextContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;

            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.lengthOf(2);
        });

        it("should include tag in SDT properties", () => {
            const control = new InlineRichTextContentControl({
                tag: "MyTestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const tagElement = sdtPr.find((el: SdtElement) => el["w:tag"]);
            expect(tagElement).to.exist;
            expect(tagElement?.["w:tag"]?._attr?.["w:val"]).to.equal("MyTestTag");
        });

        it("should include title when provided", () => {
            const control = new InlineRichTextContentControl({
                tag: "TestTag",
                title: "My Test Title",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const aliasElement = sdtPr.find((el: SdtElement) => el["w:alias"]);
            expect(aliasElement).to.exist;
            expect(aliasElement?.["w:alias"]?._attr?.["w:val"]).to.equal("My Test Title");
        });

        it("should include appearance when provided", () => {
            const control = new InlineRichTextContentControl({
                tag: "Test",
                appearance: "hidden",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const appearanceElement = sdtPr.find((el: SdtElement) => el["w:appearance"]);
            expect(appearanceElement).to.exist;
        });

        it("should include color when provided", () => {
            const control = new InlineRichTextContentControl({
                tag: "Test",
                color: "FFFF00",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const colorElement = sdtPr.find((el: SdtElement) => el["w:color"]);
            expect(colorElement).to.exist;
        });

        it("should include lock properties when provided", () => {
            const control = new InlineRichTextContentControl({
                tag: "Test",
                lock: { sdtLocked: true, contentLock: true },
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: SdtElement) => el["w:lock"]);
            expect(lockElement).to.exist;
        });

        it("should include placeholder indicator when placeholder is provided", () => {
            const control = new InlineRichTextContentControl({
                tag: "Test",
                placeholder: "Enter text",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const placeholderElement = sdtPr.find((el: SdtElement) => el["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
        });

        it("should mark as rich text control (not plain text)", () => {
            const control = new InlineRichTextContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have w:richText element (key difference from RunContentControl)
            const richTextElement = sdtPr.find((el: SdtElement) => el["w:richText"]);
            expect(richTextElement).to.exist;
        });

        it("should generate unique numeric ID", () => {
            const control1 = new InlineRichTextContentControl({
                tag: "TestTag1",
                children: [new TextRun("Test content 1")],
            });

            const control2 = new InlineRichTextContentControl({
                tag: "TestTag2",
                children: [new TextRun("Test content 2")],
            });

            const tree1 = new Formatter().format(control1) as XmlTree;
            const tree2 = new Formatter().format(control2) as XmlTree;

            const sdtPr1 = tree1["w:sdt"][0]["w:sdtPr"];
            const sdtPr2 = tree2["w:sdt"][0]["w:sdtPr"];

            const idElement1 = sdtPr1.find((el: SdtElement) => el["w:id"]);
            const idElement2 = sdtPr2.find((el: SdtElement) => el["w:id"]);

            expect(idElement1).to.exist;
            expect(idElement2).to.exist;

            // IDs should be numeric and unique
            const id1 = parseInt(idElement1?.["w:id"]?._attr?.["w:val"] ?? "0", 10);
            const id2 = parseInt(idElement2?.["w:id"]?._attr?.["w:val"] ?? "0", 10);

            expect(id1).to.be.a("number");
            expect(id2).to.be.a("number");
            expect(id1).not.to.equal(id2);
        });

        it("should include content in SDT content section", () => {
            const control = new InlineRichTextContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"] as any;

            expect(sdtContent).to.be.an("array");
            expect(sdtContent.length).to.be.greaterThan(0);
        });
    });

    describe("Nested Content Controls", () => {
        it("should support nesting RunContentControl inside InlineRichTextContentControl", () => {
            const nestedControl = new InlineRichTextContentControl({
                tag: "DocumentInfo",
                title: "Document Information",
                children: [
                    new TextRun("Report Date: "),
                    new RunContentControl({
                        tag: "ReportDate",
                        title: "Report Date",
                        children: [new TextRun("[MM/DD/YYYY]")],
                    }),
                ],
            });

            expect(() => new Formatter().format(nestedControl)).not.toThrow();
        });

        it("should generate correct OOXML structure for nested controls", () => {
            const nestedControl = new InlineRichTextContentControl({
                tag: "OuterControl",
                children: [
                    new TextRun("Prefix: "),
                    new RunContentControl({
                        tag: "InnerControl",
                        children: [new TextRun("Nested")],
                    }),
                    new TextRun(" :Suffix"),
                ],
            });

            const tree = new Formatter().format(nestedControl, mockContext as any);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"] as any;

            expect(sdtContent).to.be.an("array");
            expect(sdtContent.length).to.be.greaterThan(0);
        });

        it("should support complex nesting scenarios", () => {
            const complexControl = new InlineRichTextContentControl({
                tag: "ComplexControl",
                children: [
                    new TextRun("Start: "),
                    new RunContentControl({
                        tag: "Date1",
                        children: [new TextRun("Date 1")],
                    }),
                    new TextRun(" - "),
                    new RunContentControl({
                        tag: "Date2",
                        children: [new TextRun("Date 2")],
                    }),
                    new TextRun(" :End"),
                ],
            });

            expect(() => new Formatter().format(complexControl)).not.toThrow();
        });

        it("should maintain unique IDs for all nested controls", () => {
            const control = new InlineRichTextContentControl({
                tag: "ParentControl",
                children: [
                    new RunContentControl({
                        tag: "Child1",
                        children: [new TextRun("Child 1")],
                    }),
                    new RunContentControl({
                        tag: "Child2",
                        children: [new TextRun("Child 2")],
                    }),
                ],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            // Should have nested SDT structures
            expect(sdtContent).to.be.an("array");
        });
    });

    describe("Enhanced Properties", () => {
        it("should handle appearance property", () => {
            const control = new InlineRichTextContentControl({
                tag: "AppearanceTest",
                appearance: "tags",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const appearanceElement = sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:appearance"]);
            expect(appearanceElement).to.exist;
        });

        it("should handle color property", () => {
            const control = new InlineRichTextContentControl({
                tag: "ColorTest",
                color: "FF6600",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const colorElement = sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:color"]);
            expect(colorElement).to.exist;
        });

        it("should handle data binding property", () => {
            const control = new InlineRichTextContentControl({
                tag: "DataBindingTest",
                dataBinding: {
                    xpath: "/document/data",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789012}",
                },
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const dataBindingElement = sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:dataBinding"]);
            expect(dataBindingElement).to.exist;
        });

        it("should handle lock properties", () => {
            const control = new InlineRichTextContentControl({
                tag: "LockTest",
                lock: {
                    contentLock: true,
                    sdtLocked: true,
                },
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:lock"]);
            expect(lockElement).to.exist;
        });

        it("should handle placeholder property", () => {
            const control = new InlineRichTextContentControl({
                tag: "PlaceholderTest",
                placeholder: "Enter text here",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const placeholderElement = sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
        });

        it("should handle all enhanced properties together", () => {
            const control = new InlineRichTextContentControl({
                tag: "AllProperties",
                title: "All Properties Test",
                appearance: "boundingBox",
                color: "FF6600",
                dataBinding: {
                    xpath: "/document/data",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789012}",
                },
                lock: {
                    contentLock: true,
                    sdtLocked: false,
                },
                placeholder: "Placeholder text",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Verify all properties are present
            expect(sdtPr.find((el: SdtElement) => el["w:alias"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:tag"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:id"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:appearance"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:color"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:lock"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:showingPlcHdr"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => (el as Record<string, unknown>)["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:richText"])).to.exist;
        });
    });

    describe("XML Structure Validation", () => {
        it("should generate correct OOXML structure for basic inline rich text control", () => {
            const control = new InlineRichTextContentControl({
                tag: "BasicControl",
                children: [new TextRun("Basic content")],
            });

            const tree = new Formatter().format(control, mockContext as any);

            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.length(2);
        });

        it("should generate correct XML for control with enhanced properties", () => {
            const control = new InlineRichTextContentControl({
                tag: "EnhancedControl",
                title: "Enhanced Control",
                appearance: "tags",
                color: "FF0000",
                children: [new TextRun("Enhanced content")],
            });

            const tree = new Formatter().format(control, mockContext as any);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            expect(sdtPr).to.be.an("array");
            expect(sdtPr.length).to.be.greaterThan(0);
        });

        it("should generate correct XML for nested controls", () => {
            const control = new InlineRichTextContentControl({
                tag: "NestedControl",
                children: [
                    new TextRun("Before: "),
                    new RunContentControl({
                        tag: "Nested",
                        children: [new TextRun("Nested content")],
                    }),
                    new TextRun(" :After"),
                ],
            });

            const tree = new Formatter().format(control, mockContext as any);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(sdtContent).to.be.an("array");
        });

        it("should maintain unique numeric IDs across multiple instances", () => {
            const control1 = new InlineRichTextContentControl({
                tag: "Instance1",
                children: [new TextRun("Content 1")],
            });

            const control2 = new InlineRichTextContentControl({
                tag: "Instance2",
                children: [new TextRun("Content 2")],
            });

            const tree1 = new Formatter().format(control1) as XmlTree;
            const tree2 = new Formatter().format(control2) as XmlTree;

            const sdtPr1 = tree1["w:sdt"][0]["w:sdtPr"];
            const sdtPr2 = tree2["w:sdt"][0]["w:sdtPr"];

            const idElement1 = sdtPr1.find((el: SdtElement) => el["w:id"]);
            const idElement2 = sdtPr2.find((el: SdtElement) => el["w:id"]);

            const id1 = parseInt(idElement1?.["w:id"]?._attr?.["w:val"] ?? "0", 10);
            const id2 = parseInt(idElement2?.["w:id"]?._attr?.["w:val"] ?? "0", 10);

            expect(id1).not.to.equal(id2);
        });

        it("should never generate malformed XML", () => {
            const control = new InlineRichTextContentControl({
                tag: "MalformTest",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control, mockContext as any);
            const xmlString = JSON.stringify(tree);

            // Should contain proper OOXML structure
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
            expect(xmlString).to.include("w:richText");
        });

        it("should generate OOXML-compliant namespace prefixes", () => {
            const control = new InlineRichTextContentControl({
                tag: "NamespaceTest",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control, mockContext as any);
            const xmlString = JSON.stringify(tree);

            // Should use proper w: namespace
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:tag");
            expect(xmlString).to.include("w:richText");
        });
    });

    describe("CRITICAL: Rich Text vs Plain Text", () => {
        it("should generate w:richText (not w:text)", () => {
            const control = new InlineRichTextContentControl({
                tag: "RichTextControl",
                children: [new TextRun("Rich text content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have w:richText element
            const richTextElement = sdtPr.find((el: SdtElement) => el["w:richText"]);
            expect(richTextElement).to.exist;

            // Should NOT have w:text element (that's for RunContentControl)
            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.not.exist;
        });

        it("should support nesting when using richText", () => {
            const control = new InlineRichTextContentControl({
                tag: "NestingTest",
                children: [
                    new TextRun("Before: "),
                    new RunContentControl({
                        tag: "NestedControl",
                        children: [new TextRun("Nested")],
                    }),
                    new TextRun(" :After"),
                ],
            });

            // Should not throw (nesting is allowed with richText)
            expect(() => new Formatter().format(control)).not.toThrow();
        });
    });
});

/* eslint-disable @typescript-eslint/no-explicit-any, functional/prefer-readonly-type */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { TextRun } from "../paragraph";
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
    readonly "w:text"?: XmlElement;
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

describe("RunContentControl", () => {
    beforeEach(() => {
        // Mock the numeric ID creator to return a predictable function
        vi.spyOn(convenienceFunctions, "uniqueNumericIdCreator").mockReturnValue(() => 123456789);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const control = new RunContentControl({
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
                    new RunContentControl({
                        tag: "", // Empty tag should throw validation error
                        children: [new TextRun("Test")],
                    }),
            ).toThrow("RunContentControl: 'tag' is required and cannot be empty");
        });

        it("should throw error for missing children", () => {
            expect(
                () =>
                    new RunContentControl({
                        tag: "ValidTag",
                        children: [], // Empty children should throw validation error
                    }),
            ).toThrow(
                "RunContentControl: 'children' array is required and must contain at least one TextRun or nested RunContentControl element",
            );
        });
    });

    describe("#prepForXml()", () => {
        it("should generate correct basic OOXML structure", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control);

            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.lengthOf(2);
        });

        it("should include tag in SDT properties", () => {
            const control = new RunContentControl({
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
            const control = new RunContentControl({
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

        it("should mark as plain text control", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;
        });

        it("should generate unique numeric ID", () => {
            const control1 = new RunContentControl({
                tag: "TestTag1",
                children: [new TextRun("Test content 1")],
            });

            const control2 = new RunContentControl({
                tag: "TestTag2",
                children: [new TextRun("Test content 2")],
            });

            const tree1 = new Formatter().format(control1);
            const tree2 = new Formatter().format(control2);

            const sdtPr1 = tree1["w:sdt"][0]["w:sdtPr"];
            const sdtPr2 = tree2["w:sdt"][0]["w:sdtPr"];

            const idElement1 = sdtPr1.find((el: SdtElement) => el["w:id"]);
            const idElement2 = sdtPr2.find((el: SdtElement) => el["w:id"]);

            expect(idElement1).to.exist;
            expect(idElement2).to.exist;

            // IDs should be numeric and unique
            const id1 = parseInt(idElement1["w:id"]._attr["w:val"], 10);
            const id2 = parseInt(idElement2["w:id"]._attr["w:val"], 10);

            expect(id1).to.be.a("number");
            expect(id2).to.be.a("number");
            expect(id1).not.to.equal(id2);
        });

        it("should include content in SDT content section", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(sdtContent).to.exist;
            expect(sdtContent).to.be.an("array");
            expect(sdtContent).to.have.lengthOf(1);
        });

        it("should include appearance when provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                appearance: "tags",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const appearanceElement = sdtPr.find((el: SdtElement) => el["w:appearance"]);
            expect(appearanceElement).to.exist;
            expect((appearanceElement?.["w:appearance"] as any)?._attr?.["w:val"]).to.equal("tags");
        });

        it("should include color when provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                color: "FF0000",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const colorElement = sdtPr.find((el: SdtElement) => el["w:color"]);
            expect(colorElement).to.exist;
            expect((colorElement?.["w:color"] as any)?._attr?.["w:val"]).to.equal("FF0000");
        });

        it("should include placeholder indicator when placeholder is provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                placeholder: "Enter text here",
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const placeholderElement = sdtPr.find((el: SdtElement) => el["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
        });

        it("should include multiLine property when provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                multiLine: true,
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;
            expect(textElement?.["w:text"]?.["w:multiLine"]).to.exist;
        });

        it("should include maxLength property when provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                maxLength: 100,
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;
            expect(textElement?.["w:text"]?.["w:maxLength"]).to.exist;
        });

        it("should include defaultStyle when provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                defaultStyle: {
                    bold: true,
                    italic: true,
                    color: "0000FF",
                    fontSize: 24,
                    fontFamily: "Arial",
                },
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const rPrElement = sdtPr.find((el: SdtElement) => el["w:rPr"]);
            expect(rPrElement).to.exist;
        });

        it("should include lock properties when provided", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                lock: {
                    sdtLocked: true,
                    contentLock: true,
                },
                children: [new TextRun("Test")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: SdtElement) => el["w:lock"]);
            expect(lockElement).to.exist;
        });
    });

    describe("Nested Content Controls", () => {
        it("should support nesting RunContentControl inside RunContentControl", () => {
            const innerControl = new RunContentControl({
                tag: "InnerRun",
                title: "Inner Run Control",
                children: [new TextRun("Inner content")],
            });

            const outerControl = new RunContentControl({
                tag: "OuterRun",
                title: "Outer Run Control",
                richText: true, // 🔧 FIX: Enable nesting
                children: [new TextRun("Before: "), innerControl, new TextRun(" After")],
            });

            expect(() => new Formatter().format(outerControl)).not.toThrow();
        });

        it("should generate correct OOXML structure for nested run controls", () => {
            const innerControl = new RunContentControl({
                tag: "NestedDate",
                children: [new TextRun("MM/DD/YYYY")],
            });

            const outerControl = new RunContentControl({
                tag: "DocumentDate",
                richText: true, // 🔧 FIX: Enable nesting
                children: [new TextRun("Date: "), innerControl],
            });

            const tree = new Formatter().format(outerControl);
            const outerSdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(outerSdtContent).to.have.lengthOf(2);
            // First element should be text run
            expect(outerSdtContent[0]).to.have.property("w:r");
            // Second element should be nested SDT
            expect(outerSdtContent[1]).to.have.property("w:sdt");

            // Check the nested SDT structure
            const nestedSdt = outerSdtContent[1]["w:sdt"];
            expect(nestedSdt).to.be.an("array");
            expect(nestedSdt).to.have.lengthOf(2); // Properties + Content

            // Nested control should have its own properties
            const nestedSdtPr = nestedSdt[0]["w:sdtPr"];
            const nestedTagElement = nestedSdtPr.find((el: SdtElement) => el["w:tag"]);
            expect(nestedTagElement["w:tag"]._attr["w:val"]).to.equal("NestedDate");
        });

        it("should support complex nesting scenarios", () => {
            const dateControl = new RunContentControl({
                tag: "ActualDate",
                children: [new TextRun("12/19/2024")],
            });

            const timeControl = new RunContentControl({
                tag: "ActualTime",
                children: [new TextRun("3:30 PM")],
            });

            const dateTimeControl = new RunContentControl({
                tag: "DateTime",
                title: "Document Date and Time",
                richText: true, // 🔧 FIX: Enable nesting
                children: [dateControl, new TextRun(" at "), timeControl],
            });

            const fullControl = new RunContentControl({
                tag: "DocumentInfo",
                title: "Document Information",
                richText: true, // 🔧 FIX: Enable nesting
                children: [new TextRun("Generated on "), dateTimeControl, new TextRun(" by system.")],
            });

            expect(() => new Formatter().format(fullControl)).not.toThrow();

            const tree = new Formatter().format(fullControl);
            expect(tree).to.have.property("w:sdt");

            // Verify the nested structure exists
            const topSdtContent = tree["w:sdt"][1]["w:sdtContent"];
            expect(topSdtContent).to.have.lengthOf(3); // "Generated on " + nested control + " by system."
        });

        it("should maintain unique IDs for all nested run controls", () => {
            const innerControl = new RunContentControl({
                tag: "InnerControl",
                children: [new TextRun("Inner")],
            });

            const outerControl = new RunContentControl({
                tag: "OuterControl",
                richText: true, // 🔧 FIX: Enable nesting
                children: [innerControl],
            });

            const tree = new Formatter().format(outerControl);

            // Get outer control ID
            const outerSdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const outerIdElement = outerSdtPr.find((el: SdtElement) => el["w:id"]);
            const outerId = outerIdElement["w:id"]._attr["w:val"];

            // Get inner control ID
            const outerSdtContent = tree["w:sdt"][1]["w:sdtContent"];
            const innerSdt = outerSdtContent[0]["w:sdt"];
            const innerSdtPr = innerSdt[0]["w:sdtPr"];
            const innerIdElement = innerSdtPr.find((el: SdtElement) => el["w:id"]);
            const innerId = innerIdElement["w:id"]._attr["w:val"];

            // IDs should be different
            expect(outerId).not.to.equal(innerId);
            expect(parseInt(outerId, 10)).to.be.a("number");
            expect(parseInt(innerId, 10)).to.be.a("number");
        });

        it("should handle practical use case: date within document info", () => {
            // Real-world scenario: Document header with nested date control
            const dateControl = new RunContentControl({
                tag: "ReportDate",
                title: "Report Date",
                children: [new TextRun("[Date]")],
            });

            const documentInfoControl = new RunContentControl({
                tag: "DocumentHeader",
                title: "Document Header",
                richText: true, // 🔧 FIX: Enable nesting
                children: [
                    new TextRun({
                        text: "Monthly Report - ",
                        bold: true,
                    }),
                    dateControl,
                ],
            });

            const tree = new Formatter().format(documentInfoControl);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(sdtContent).to.have.lengthOf(2);
            // Should have bold text run + nested date control
            expect(sdtContent[0]).to.have.property("w:r"); // "Monthly Report - "
            expect(sdtContent[1]).to.have.property("w:sdt"); // nested date control
        });
    });

    describe("Enhanced Properties", () => {
        it("should handle appearance property", () => {
            const control = new RunContentControl({
                tag: "AppearanceTest",
                appearance: "tags",
                children: [new TextRun("Test content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const appearanceElement = sdtPr.find((el: SdtElement) => el["w:appearance"]);
            expect(appearanceElement).to.exist;
            expect((appearanceElement?.["w:appearance"] as any)?._attr["w:val"]).to.equal("tags");
        });

        it("should handle appearance: 'hidden' property correctly", () => {
            const control = new RunContentControl({
                tag: "HiddenAppearanceTest",
                appearance: "hidden",
                children: [new TextRun("This should be hidden")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Check that appearance element exists with hidden value
            const appearanceElement = sdtPr.find((el: SdtElement) => el["w:appearance"]);
            expect(appearanceElement).to.exist;
            expect((appearanceElement?.["w:appearance"] as any)?._attr["w:val"]).to.equal("hidden");

            // Verify full XML structure is correct
            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.length(2);
        });

        it("should test all appearance values for XML generation", () => {
            const appearances = ["boundingBox", "tags", "hidden"];

            appearances.forEach((appearance) => {
                const control = new RunContentControl({
                    tag: `Test_${appearance}`,
                    appearance: appearance as "boundingBox" | "tags" | "hidden",
                    children: [new TextRun(`Content for ${appearance}`)],
                });

                const tree = new Formatter().format(control);
                const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
                const appearanceElement = sdtPr.find((el: SdtElement) => el["w:appearance"]);

                expect(appearanceElement).to.exist;
                expect(appearanceElement["w:appearance"]._attr["w:val"]).to.equal(appearance);

                // Verify XML structure is consistent across all appearances
                expect(tree["w:sdt"]).to.have.length(2);
                expect(sdtPr).to.be.an("array");
            });
        });

        it("should handle color property", () => {
            const control = new RunContentControl({
                tag: "ColorTest",
                color: "FF0000",
                children: [new TextRun("Red border")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const colorElement = sdtPr.find((el: SdtElement) => el["w:color"]);
            expect(colorElement).to.exist;
            expect((colorElement?.["w:color"] as any)?._attr["w:val"]).to.equal("FF0000");
        });

        it("should handle data binding property", () => {
            const control = new RunContentControl({
                tag: "DataBoundTest",
                dataBinding: {
                    xpath: "/root/customer/name",
                    storeItemId: "{12345678-1234-1234-1234-123456789012}",
                },
                children: [new TextRun("Customer Name")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const dataBindingElement = sdtPr.find((el: SdtElement) => el["w:dataBinding"]);
            expect(dataBindingElement).to.exist;
            expect((dataBindingElement?.["w:dataBinding"] as any)?._attr["w:xpath"]).to.equal("/root/customer/name");
            expect((dataBindingElement?.["w:dataBinding"] as any)?._attr["w:storeItemID"]).to.equal(
                "{12345678-1234-1234-1234-123456789012}",
            );
        });

        it("should handle multiple enhanced properties together", () => {
            const control = new RunContentControl({
                tag: "FullyEnhanced",
                title: "Enhanced Control",
                appearance: "boundingBox",
                color: "0066CC",
                dataBinding: {
                    xpath: "/data/field",
                    storeItemId: "{11111111-2222-3333-4444-555555555555}",
                },
                children: [new TextRun("Enhanced content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have all properties
            expect(sdtPr.find((el: SdtElement) => el["w:alias"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:tag"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:id"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:appearance"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:color"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:text"])).to.exist;
        });

        it("should use default values for optional enhanced properties", () => {
            const control = new RunContentControl({
                tag: "MinimalTest",
                children: [new TextRun("Content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should NOT have appearance, color, or dataBinding elements when not specified
            expect(sdtPr.find((el: SdtElement) => el["w:appearance"])).to.not.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:color"])).to.not.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:dataBinding"])).to.not.exist;

            // But should still have required elements
            expect(sdtPr.find((el: SdtElement) => el["w:tag"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:id"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:text"])).to.exist;
        });

        it("should handle lock properties", () => {
            const control = new RunContentControl({
                tag: "LockedControl",
                lock: {
                    contentLock: true,
                    sdtLocked: true,
                },
                children: [new TextRun("Locked content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: SdtElement) => el["w:lock"]);
            expect(lockElement).to.exist;
            expect((lockElement?.["w:lock"] as any)?._attr?.["w:contentLocked"]).to.equal("1");
            expect((lockElement?.["w:lock"] as any)?._attr?.["w:sdtLocked"]).to.equal("1");
        });

        it("should handle partial lock properties", () => {
            const control = new RunContentControl({
                tag: "PartialLock",
                lock: {
                    contentLock: true,
                    // sdtLocked intentionally omitted
                },
                children: [new TextRun("Content locked only")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: SdtElement) => el["w:lock"]);
            expect(lockElement).to.exist;
            expect((lockElement?.["w:lock"] as any)?._attr["w:contentLocked"]).to.equal("1");
            expect((lockElement?.["w:lock"] as any)?._attr).to.not.have.property("w:sdtLocked");
        });

        it("should handle placeholder property", () => {
            const control = new RunContentControl({
                tag: "PlaceholderTest",
                placeholder: "Click here to enter text",
                children: [new TextRun("Default content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const placeholderElement = sdtPr.find((el: SdtElement) => el["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
            expect(placeholderElement?.["w:showingPlcHdr"]).to.deep.equal({});
        });

        it("should handle multiLine text property", () => {
            const control = new RunContentControl({
                tag: "MultiLineTest",
                multiLine: true,
                children: [new TextRun("Multi-line content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;
            expect((textElement?.["w:text"] as Record<string, unknown>)?.["w:multiLine"]).to.exist;
            expect(((textElement?.["w:text"] as Record<string, unknown>)?.["w:multiLine"] as any)?._attr["w:val"]).to.equal("1");
        });

        it("should handle maxLength text property", () => {
            const control = new RunContentControl({
                tag: "MaxLengthTest",
                maxLength: 50,
                children: [new TextRun("Limited length")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;
            expect((textElement?.["w:text"] as Record<string, unknown>)?.["w:maxLength"]).to.exist;
            expect(((textElement?.["w:text"] as Record<string, unknown>)?.["w:maxLength"] as any)?._attr["w:val"]).to.equal("50");
        });

        it("should handle defaultStyle properties", () => {
            const control = new RunContentControl({
                tag: "StyledTest",
                defaultStyle: {
                    bold: true,
                    italic: true,
                    color: "FF0000",
                    fontSize: 28,
                    fontFamily: "Arial",
                },
                children: [new TextRun("Styled content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const rPrElement = sdtPr.find((el: SdtElement) => el["w:rPr"]);
            expect(rPrElement).to.exist;

            const rPrContent = rPrElement?.["w:rPr"] as SdtElement[];
            expect(rPrContent?.find((el: SdtElement) => el["w:b"])).to.exist;
            expect(rPrContent?.find((el: SdtElement) => el["w:i"])).to.exist;
            expect((rPrContent?.find((el: SdtElement) => el["w:color"])?.["w:color"] as any)?._attr["w:val"]).to.equal("FF0000");
            expect((rPrContent?.find((el: SdtElement) => el["w:sz"])?.["w:sz"] as any)?._attr["w:val"]).to.equal("28");
            expect((rPrContent?.find((el: SdtElement) => el["w:rFonts"])?.["w:rFonts"] as any)?._attr["w:ascii"]).to.equal("Arial");
        });

        it("should handle all Phase 2A properties together", () => {
            const control = new RunContentControl({
                tag: "CompletePhase2A",
                title: "Complete Phase 2A Control",
                appearance: "boundingBox",
                color: "0066CC",
                lock: {
                    contentLock: false,
                    sdtLocked: true,
                },
                placeholder: "Enter your text here",
                multiLine: true,
                maxLength: 100,
                defaultStyle: {
                    bold: true,
                    color: "FF6600",
                },
                dataBinding: {
                    xpath: "/root/data",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789001}",
                },
                children: [new TextRun("Phase 2A complete content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Verify all properties are present
            expect(sdtPr.find((el: SdtElement) => el["w:alias"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:tag"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:id"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:appearance"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:color"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:lock"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:showingPlcHdr"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:text"])).to.exist;
            expect(sdtPr.find((el: SdtElement) => el["w:rPr"])).to.exist;
        });
    });

    describe("XML Structure Validation", () => {
        let formatter: Formatter;

        beforeEach(() => {
            formatter = new Formatter();
        });

        it("should generate correct OOXML structure for basic run control", () => {
            const control = new RunContentControl({
                tag: "TestTag",
                title: "Test Title",
                children: [new TextRun("Test content")],
            });

            const xmlTree = formatter.format(control, mockContext as any);

            // Validate core structure exists
            expect(xmlTree).to.have.property("w:sdt");
            expect(xmlTree["w:sdt"]).to.be.an("array");
            expect(xmlTree["w:sdt"]).to.have.length(2);

            // Validate sdtPr structure
            const sdtPr = xmlTree["w:sdt"][0]["w:sdtPr"];
            expect(sdtPr).to.be.an("array");

            // Check for required properties
            const hasAlias = sdtPr.some((prop: unknown) => {
                const propRecord = prop as Record<string, unknown>;
                const alias = propRecord["w:alias"] as Record<string, unknown> | undefined;
                return alias && (alias._attr as Record<string, unknown>)["w:val"] === "Test Title";
            });
            const hasTag = sdtPr.some((prop: unknown) => {
                const propRecord = prop as Record<string, unknown>;
                const tag = propRecord["w:tag"] as Record<string, unknown> | undefined;
                return tag && (tag._attr as Record<string, unknown>)["w:val"] === "TestTag";
            });
            const hasId = sdtPr.some((prop: unknown) => {
                const propRecord = prop as Record<string, unknown>;
                const id = propRecord["w:id"] as Record<string, unknown> | undefined;
                return id && (id._attr as Record<string, unknown>)["w:val"];
            });
            const hasText = sdtPr.some((prop: unknown) => (prop as Record<string, unknown>)["w:text"]);

            expect(hasAlias).to.be.true;
            expect(hasTag).to.be.true;
            expect(hasId).to.be.true;
            expect(hasText).to.be.true;

            // Validate content structure
            const sdtContent = xmlTree["w:sdt"][1]["w:sdtContent"];
            expect(sdtContent).to.be.an("array");
            expect(sdtContent).to.have.length(1);
            expect(sdtContent[0]).to.have.property("w:r");
        });

        it("should generate correct XML for run control with enhanced properties", () => {
            const control = new RunContentControl({
                tag: "EnhancedTag",
                title: "Enhanced Control",
                appearance: "boundingBox",
                color: "FF0000",
                children: [new TextRun("Placeholder")],
            });

            const xmlTree = formatter.format(control, mockContext as any);

            // Verify core structure exists
            expect(xmlTree).to.have.property("w:sdt");
            expect(xmlTree["w:sdt"]).to.be.an("array");
            expect(xmlTree["w:sdt"]).to.have.length(2);

            // Verify sdtPr contains enhanced properties
            const sdtPr = xmlTree["w:sdt"][0]["w:sdtPr"];
            expect(sdtPr).to.be.an("array");

            // Check that enhanced properties are present in XML string
            const xmlString = JSON.stringify(xmlTree);

            expect(xmlString).to.include("boundingBox");
            expect(xmlString).to.include("FF0000");
            expect(xmlString).to.include("Enhanced Control");

            // Verify content structure
            const sdtContent = xmlTree["w:sdt"][1]["w:sdtContent"];
            expect(sdtContent).to.be.an("array");
            expect(sdtContent).to.have.length(1);
        });

        it("should generate correct XML for nested run controls", () => {
            const innerControl = new RunContentControl({
                tag: "InnerTag",
                children: [new TextRun("Inner content")],
            });

            const outerControl = new RunContentControl({
                tag: "OuterTag",
                richText: true, // 🔧 FIX: Enable nesting
                children: [new TextRun("Before: "), innerControl, new TextRun(" After")],
            });

            const xmlTree = formatter.format(outerControl, mockContext as any);

            // Should have outer sdt structure
            expect(xmlTree).to.have.property("w:sdt");
            expect(xmlTree["w:sdt"]).to.have.length(2);

            // Content should contain nested sdt
            const sdtContent = xmlTree["w:sdt"][1]["w:sdtContent"];
            expect(sdtContent).to.be.an("array");
            expect(sdtContent.length).to.be.greaterThan(1); // Multiple children including nested sdt
        });

        it("should maintain unique numeric IDs across multiple instances", () => {
            // Reset the mock to return incrementing values
            let idCounter = 100000;
            vi.spyOn(convenienceFunctions, "uniqueNumericIdCreator").mockReturnValue(() => ++idCounter);

            const control1 = new RunContentControl({
                tag: "Control1",
                children: [new TextRun("Content 1")],
            });

            const control2 = new RunContentControl({
                tag: "Control2",
                children: [new TextRun("Content 2")],
            });

            const xml1 = formatter.format(control1, mockContext as any);
            const xml2 = formatter.format(control2, mockContext as any);

            // Extract IDs from XML
            const xml1Tree = xml1 as XmlTree;
            const xml2Tree = xml2 as XmlTree;
            const id1Element = xml1Tree["w:sdt"][0]["w:sdtPr"].find((prop: SdtElement) => (prop as Record<string, unknown>)["w:id"]);
            const id2Element = xml2Tree["w:sdt"][0]["w:sdtPr"].find((prop: SdtElement) => (prop as Record<string, unknown>)["w:id"]);
            const id1 = id1Element?.["w:id"]?._attr?.["w:val"] ?? "";
            const id2 = id2Element?.["w:id"]?._attr?.["w:val"] ?? "";

            // IDs should be different numeric values
            expect(id1).to.be.a("string");
            expect(id2).to.be.a("string");
            expect(id1).not.to.equal(id2);
            expect(parseInt(id1, 10)).to.be.a("number");
            expect(parseInt(id2, 10)).to.be.a("number");
        });

        it("should never generate malformed XML with rootKey issues", () => {
            const control = new RunContentControl({
                tag: "MalformTest",
                children: [new TextRun("Test content")],
            });

            const xmlTree = formatter.format(control, mockContext as any);

            // Convert to JSON string to check for malformed patterns
            const xmlString = JSON.stringify(xmlTree);

            // Should NOT contain rootKey (that was our bug!)
            expect(xmlString).not.to.include("rootKey");
            expect(xmlString).not.to.include("<rootKey>");

            // Should contain proper w:sdt structure
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
        });

        it("should generate OOXML-compliant namespace prefixes", () => {
            const control = new RunContentControl({
                tag: "NamespaceTest",
                title: "Namespace Test", // Add title to ensure w:alias is generated
                children: [new TextRun("Test")],
            });

            const xmlTree = formatter.format(control, mockContext as any);
            const xmlString = JSON.stringify(xmlTree);

            // Should use w: namespace prefix (OOXML standard)
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
            expect(xmlString).to.include("w:alias");
            expect(xmlString).to.include("w:tag");
            expect(xmlString).to.include("w:id");
            expect(xmlString).to.include("w:text");

            // Should NOT use incorrect namespaces
            expect(xmlString).not.to.include("sdt:");
            expect(xmlString).not.to.include("w14:text"); // text should be w:text, not w14:text
        });
    });

    describe("CRITICAL: richText Parameter Tests", () => {
        it("should generate w:text for richText: false (default)", () => {
            const control = new RunContentControl({
                tag: "PlainTextControl",
                richText: false,
                children: [new TextRun("Plain text content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have w:text element for plain text mode
            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;

            // Should NOT have w:richText element
            const richTextElement = sdtPr.find((el: SdtElement) => el["w:richText"]);
            expect(richTextElement).to.not.exist;
        });

        it("should generate w:text for richText: undefined (default behavior)", () => {
            const control = new RunContentControl({
                tag: "DefaultControl",
                // richText: undefined (default)
                children: [new TextRun("Default behavior")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should default to w:text (plain text mode)
            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.exist;

            // Should NOT have w:richText element by default
            const richTextElement = sdtPr.find((el: SdtElement) => el["w:richText"]);
            expect(richTextElement).to.not.exist;
        });

        it("should generate w:richText for richText: true", () => {
            const control = new RunContentControl({
                tag: "RichTextControl",
                richText: true,
                children: [new TextRun("Rich text content")],
            });

            const tree = new Formatter().format(control) as XmlTree;
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have w:richText element for rich text mode
            const richTextElement = sdtPr.find((el: SdtElement) => el["w:richText"]);
            expect(richTextElement).to.exist;
            expect(richTextElement?.["w:richText"]).to.deep.equal({});

            // Should NOT have w:text element
            const textElement = sdtPr.find((el: SdtElement) => el["w:text"]);
            expect(textElement).to.not.exist;
        });

        it("should support nesting when richText: true", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Nested content")],
            });

            const parentControl = new RunContentControl({
                tag: "ParentControl",
                richText: true, // 🔧 KEY: Enables nesting
                children: [new TextRun("Before: "), nestedControl, new TextRun(" After")],
            });

            // Should not throw when nesting is allowed
            expect(() => new Formatter().format(parentControl)).not.toThrow();

            const tree = new Formatter().format(parentControl);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Parent should have w:richText marker
            const richTextElement = sdtPr.find((el: SdtElement) => el["w:richText"]);
            expect(richTextElement).to.exist;
        });

        it("should maintain richText property through multiple controls", () => {
            const plainControl = new RunContentControl({
                tag: "PlainControl",
                richText: false,
                children: [new TextRun("Plain")],
            });

            const richControl = new RunContentControl({
                tag: "RichControl",
                richText: true,
                children: [new TextRun("Rich")],
            });

            const plainTree = new Formatter().format(plainControl);
            const richTree = new Formatter().format(richControl);

            const plainSdtPr = plainTree["w:sdt"][0]["w:sdtPr"];
            const richSdtPr = richTree["w:sdt"][0]["w:sdtPr"];

            // Plain control should have w:text
            expect(plainSdtPr.find((el: SdtElement) => el["w:text"])).to.exist;
            expect(plainSdtPr.find((el: SdtElement) => el["w:richText"])).to.not.exist;

            // Rich control should have w:richText
            expect(richSdtPr.find((el: SdtElement) => el["w:richText"])).to.exist;
            expect(richSdtPr.find((el: SdtElement) => el["w:text"])).to.not.exist;
        });
    });

    describe("CRITICAL: Nesting Validation Error Tests", () => {
        it("should throw helpful error when nesting without richText: true", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Nested")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    richText: false, // ❌ Plain text mode - nesting not allowed
                    children: [
                        new TextRun("Before: "),
                        nestedControl, // This should trigger validation error
                    ],
                });
            }).toThrow(/RunContentControl nesting error.*plain text RunContentControl/);
        });

        it("should throw error when nesting without richText parameter (defaults to false)", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Nested")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    // richText: undefined (defaults to false)
                    children: [
                        new TextRun("Before: "),
                        nestedControl, // This should trigger validation error
                    ],
                });
            }).toThrow(/RunContentControl nesting error/);
        });

        it("should provide detailed error message with solutions", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Test")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    children: [nestedControl],
                });
            }).toThrow(/SOLUTIONS[\s\S]*richText: true/);
        });

        it("should mention OOXML specification violation in error", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Test")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    children: [nestedControl],
                });
            }).toThrow(/violates the OOXML specification.*Microsoft Word to reject/);
        });

        it("should identify the specific nested control type in error", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Test")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    children: [nestedControl],
                });
            }).toThrow(/Cannot nest RunContentControl inside a plain text RunContentControl/);
        });

        it("should detect multiple nested controls and report first violation", () => {
            const nested1 = new RunContentControl({
                tag: "Nested1",
                children: [new TextRun("Test1")],
            });

            const nested2 = new RunContentControl({
                tag: "Nested2",
                children: [new TextRun("Test2")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    children: [
                        new TextRun("Before: "),
                        nested1, // This should be detected and reported
                        new TextRun(" Between: "),
                        nested2, // This might not be reached due to early exit
                    ],
                });
            }).toThrow(/Cannot nest RunContentControl/);
        });

        it("should allow nesting when richText: true (no validation error)", () => {
            const nestedControl = new RunContentControl({
                tag: "NestedControl",
                children: [new TextRun("Nested content")],
            });

            expect(() => {
                new RunContentControl({
                    tag: "ParentControl",
                    richText: true, // ✅ Rich text mode - nesting allowed
                    children: [
                        new TextRun("Before: "),
                        nestedControl, // This should be allowed
                    ],
                });
            }).not.toThrow();
        });
    });

    describe("CRITICAL: OOXML Compliance Tests", () => {
        it("should generate Word-compatible OOXML structure for plain text", () => {
            const control = new RunContentControl({
                tag: "ComplianceTest",
                richText: false,
                children: [new TextRun("Compliance test")],
            });

            const tree = new Formatter().format(control);
            const xmlString = JSON.stringify(tree);

            // Must use correct OOXML namespace and structure
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
            expect(xmlString).to.include("w:text");

            // Must NOT include incorrect elements that break Word
            expect(xmlString).not.to.include("w:richText");
            expect(xmlString).not.to.include("rootKey"); // Our old bug
            expect(xmlString).not.to.include("<rootKey>"); // XML version of bug
        });

        it("should generate Word-compatible OOXML structure for rich text", () => {
            const control = new RunContentControl({
                tag: "RichComplianceTest",
                richText: true,
                children: [new TextRun("Rich compliance test")],
            });

            const tree = new Formatter().format(control);
            const xmlString = JSON.stringify(tree);

            // Must use correct OOXML namespace and structure for rich text
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
            expect(xmlString).to.include("w:richText");

            // Must NOT include plain text elements
            expect(xmlString).not.to.include("w:text");
            expect(xmlString).not.to.include("rootKey");
        });

        it("should use correct namespace prefixes throughout", () => {
            const control = new RunContentControl({
                tag: "NamespaceTest",
                title: "Namespace Test Title",
                richText: true,
                children: [new TextRun("Namespace test")],
            });

            const tree = new Formatter().format(control);
            const xmlString = JSON.stringify(tree);

            // All elements should use w: prefix (WordprocessingML namespace)
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
            expect(xmlString).to.include("w:alias");
            expect(xmlString).to.include("w:tag");
            expect(xmlString).to.include("w:id");
            expect(xmlString).to.include("w:richText");

            // Should NOT use wrong namespaces that break Word compatibility
            expect(xmlString).not.to.include("w14:text"); // w14 is for Word 2010 extensions only
            expect(xmlString).not.to.include("sdt:"); // Should not use bare sdt namespace
        });

        it("should maintain OOXML compliance with enhanced properties", () => {
            const control = new RunContentControl({
                tag: "EnhancedCompliance",
                title: "Enhanced Compliance Test",
                appearance: "boundingBox",
                color: "FF0000",
                richText: true,
                children: [new TextRun("Enhanced content")],
            });

            const tree = new Formatter().format(control);
            const xmlString = JSON.stringify(tree);

            // All enhanced properties should use correct OOXML structure
            expect(xmlString).to.include("w:alias");
            expect(xmlString).to.include("w:appearance");
            expect(xmlString).to.include("w:color");
            expect(xmlString).to.include("w:richText");

            // Should maintain proper XML attribute structure
            expect(xmlString).to.include("_attr");
            expect(xmlString).to.include("boundingBox");
            expect(xmlString).to.include("FF0000");
        });

        it("should generate OOXML that matches Word's expected SDT structure", () => {
            const control = new RunContentControl({
                tag: "WordCompatTest",
                richText: false,
                children: [new TextRun("Word compatibility")],
            });

            const tree = new Formatter().format(control);

            // Verify exact OOXML structure Word expects
            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.length(2);

            // First element: w:sdtPr (properties)
            const sdtPr = tree["w:sdt"][0];
            expect(sdtPr).to.have.property("w:sdtPr");
            expect(sdtPr["w:sdtPr"]).to.be.an("array");

            // Second element: w:sdtContent (content)
            const sdtContent = tree["w:sdt"][1];
            expect(sdtContent).to.have.property("w:sdtContent");
            expect(sdtContent["w:sdtContent"]).to.be.an("array");

            // Properties must include required elements
            const propsArray = sdtPr["w:sdtPr"];
            const hasTag = propsArray.some((prop: unknown) => (prop as Record<string, unknown>)["w:tag"]);
            const hasId = propsArray.some((prop: unknown) => (prop as Record<string, unknown>)["w:id"]);
            const hasTextOrRich = propsArray.some(
                (prop: unknown) => (prop as Record<string, unknown>)["w:text"] || (prop as Record<string, unknown>)["w:richText"],
            );

            expect(hasTag).to.be.true;
            expect(hasId).to.be.true;
            expect(hasTextOrRich).to.be.true;
        });
    });
});

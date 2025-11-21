import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { Paragraph } from "../paragraph";
import { Table, TableCell, TableRow } from "../table";
import { BlockContentControl } from "./block-content-control";

describe("BlockContentControl", () => {
    beforeEach(() => {
        // Mock the numeric ID creator to return a predictable function
        vi.spyOn(convenienceFunctions, "uniqueNumericIdCreator").mockReturnValue(() => 987654321);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                children: [new Paragraph("Test content")],
            });
            const stringifiedJson = JSON.stringify(control);

            // Should not throw
            expect(() => JSON.parse(stringifiedJson)).not.toThrow();
        });

        it("should throw error for empty tag", () => {
            expect(
                () =>
                    new BlockContentControl({
                        tag: "", // Empty tag should throw validation error
                        children: [new Paragraph("Test")],
                    }),
            ).toThrow("BlockContentControl: 'tag' is required and cannot be empty");
        });

        it("should throw error for missing children", () => {
            expect(
                () =>
                    new BlockContentControl({
                        tag: "ValidTag",
                        children: [], // Empty children should throw validation error
                    }),
            ).toThrow("BlockContentControl: 'children' array is required and must contain at least one Paragraph or Table element");
        });

        it("should accept mixed Paragraph and Table children", () => {
            expect(
                () =>
                    new BlockContentControl({
                        tag: "MixedContent",
                        children: [
                            new Paragraph("Introduction"),
                            new Table({
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph("Cell content")],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new Paragraph("Conclusion"),
                        ],
                    }),
            ).not.toThrow();
        });
    });

    describe("#prepForXml()", () => {
        it("should generate correct basic OOXML structure", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                children: [new Paragraph("Test content")],
            });

            const tree = new Formatter().format(control);

            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.lengthOf(2);
        });

        it("should include tag in SDT properties", () => {
            const control = new BlockContentControl({
                tag: "MyTestBlock",
                children: [new Paragraph("Test content")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const tagElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"]);
            expect(tagElement).to.exist;
            expect(tagElement["w:tag"]._attr["w:val"]).to.equal("MyTestBlock");
        });

        it("should include title when provided", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                title: "My Block Title",
                children: [new Paragraph("Test content")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const aliasElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:alias"]);
            expect(aliasElement).to.exist;
            expect(aliasElement["w:alias"]._attr["w:val"]).to.equal("My Block Title");
        });

        it("should include appearance when provided", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                appearance: "tags",
                children: [new Paragraph("Test")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const appearanceElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"]);
            expect(appearanceElement).to.exist;
        });

        it("should include color when provided", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                color: "00FF00",
                children: [new Paragraph("Test")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const colorElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"]);
            expect(colorElement).to.exist;
        });

        it("should include placeholder indicator when placeholder is provided", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                placeholder: "Enter content here",
                children: [new Paragraph("Test")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const placeholderElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
        });

        it("should include lock properties when provided", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                lock: {
                    sdtLocked: true,
                    contentLock: true,
                },
                children: [new Paragraph("Test")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:lock"]);
            expect(lockElement).to.exist;
        });

        it("should mark as rich text control", () => {
            const control = new BlockContentControl({
                tag: "TestBlock",
                children: [new Paragraph("Test content")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const richTextElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:richText"]);
            expect(richTextElement).to.exist;

            // Should NOT have w:text element (that's for RunContentControl)
            const textElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:text"]);
            expect(textElement).to.not.exist;
        });

        it("should generate unique numeric ID", () => {
            const control1 = new BlockContentControl({
                tag: "TestBlock1",
                children: [new Paragraph("Test content 1")],
            });

            const control2 = new BlockContentControl({
                tag: "TestBlock2",
                children: [new Paragraph("Test content 2")],
            });

            const tree1 = new Formatter().format(control1);
            const tree2 = new Formatter().format(control2);

            const sdtPr1 = tree1["w:sdt"][0]["w:sdtPr"];
            const sdtPr2 = tree2["w:sdt"][0]["w:sdtPr"];

            const idElement1 = sdtPr1.find((el: unknown) => (el as Record<string, unknown>)["w:id"]);
            const idElement2 = sdtPr2.find((el: unknown) => (el as Record<string, unknown>)["w:id"]);

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
            const control = new BlockContentControl({
                tag: "TestBlock",
                children: [new Paragraph("First paragraph"), new Paragraph("Second paragraph")],
            });

            const tree = new Formatter().format(control);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(sdtContent).to.exist;
            expect(sdtContent).to.be.an("array");
            expect(sdtContent).to.have.lengthOf(2); // Two paragraphs
        });

        it("should handle mixed Paragraph and Table content", () => {
            const control = new BlockContentControl({
                tag: "MixedContent",
                title: "Mixed Content Block",
                children: [
                    new Paragraph("Introduction paragraph"),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Table cell content")],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            const tree = new Formatter().format(control);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(sdtContent).to.exist;
            expect(sdtContent).to.be.an("array");
            expect(sdtContent).to.have.lengthOf(2); // Paragraph + Table

            // First element should be paragraph
            expect(sdtContent[0]).to.have.property("w:p");
            // Second element should be table
            expect(sdtContent[1]).to.have.property("w:tbl");
        });
    });

    describe("Nested Content Controls", () => {
        it("should support nesting BlockContentControl inside BlockContentControl", () => {
            const innerControl = new BlockContentControl({
                tag: "InnerSection",
                title: "Inner Section",
                children: [new Paragraph("Inner paragraph 1"), new Paragraph("Inner paragraph 2")],
            });

            const outerControl = new BlockContentControl({
                tag: "OuterSection",
                title: "Outer Section",
                children: [new Paragraph("Before nested section"), innerControl, new Paragraph("After nested section")],
            });

            expect(() => new Formatter().format(outerControl)).not.toThrow();
        });

        it("should generate correct OOXML structure for nested controls", () => {
            const innerControl = new BlockContentControl({
                tag: "InnerBlock",
                children: [new Paragraph("Inner content")],
            });

            const outerControl = new BlockContentControl({
                tag: "OuterBlock",
                children: [new Paragraph("Outer content"), innerControl],
            });

            const tree = new Formatter().format(outerControl);
            const outerSdtContent = tree["w:sdt"][1]["w:sdtContent"];

            expect(outerSdtContent).to.have.lengthOf(2);
            // First element should be paragraph
            expect(outerSdtContent[0]).to.have.property("w:p");
            // Second element should be nested SDT
            expect(outerSdtContent[1]).to.have.property("w:sdt");

            // Check the nested SDT structure
            const nestedSdt = outerSdtContent[1]["w:sdt"];
            expect(nestedSdt).to.be.an("array");
            expect(nestedSdt).to.have.lengthOf(2); // Properties + Content

            // Nested control should have its own properties
            const nestedSdtPr = nestedSdt[0]["w:sdtPr"];
            const nestedTagElement = nestedSdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"]);
            expect(nestedTagElement["w:tag"]._attr["w:val"]).to.equal("InnerBlock");
        });

        it("should support deep nesting (three levels)", () => {
            const deepestControl = new BlockContentControl({
                tag: "Level3",
                children: [new Paragraph("Deepest content")],
            });

            const middleControl = new BlockContentControl({
                tag: "Level2",
                children: [new Paragraph("Middle content"), deepestControl],
            });

            const topControl = new BlockContentControl({
                tag: "Level1",
                children: [new Paragraph("Top content"), middleControl, new Paragraph("After nested sections")],
            });

            expect(() => new Formatter().format(topControl)).not.toThrow();

            const tree = new Formatter().format(topControl);
            expect(tree).to.have.property("w:sdt");

            // Verify the nested structure exists
            const topSdtContent = tree["w:sdt"][1]["w:sdtContent"];
            expect(topSdtContent).to.have.lengthOf(3); // paragraph + nested control + paragraph
        });

        it("should support mixed content with nested controls", () => {
            const nestedControl = new BlockContentControl({
                tag: "NestedTerms",
                title: "Nested Terms",
                children: [new Paragraph("Nested term 1"), new Paragraph("Nested term 2")],
            });

            const mixedControl = new BlockContentControl({
                tag: "ContractSection",
                title: "Contract Section",
                children: [
                    new Paragraph("Contract Introduction"),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Contract Data")],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    nestedControl,
                    new Paragraph("Contract Conclusion"),
                ],
            });

            expect(() => new Formatter().format(mixedControl)).not.toThrow();

            const tree = new Formatter().format(mixedControl);
            const sdtContent = tree["w:sdt"][1]["w:sdtContent"];

            // Should have: paragraph + table + nested SDT + paragraph = 4 elements
            expect(sdtContent).to.have.lengthOf(4);
            expect(sdtContent[0]).to.have.property("w:p"); // intro paragraph
            expect(sdtContent[1]).to.have.property("w:tbl"); // table
            expect(sdtContent[2]).to.have.property("w:sdt"); // nested control
            expect(sdtContent[3]).to.have.property("w:p"); // conclusion paragraph
        });

        it("should maintain unique IDs for nested controls", () => {
            const innerControl = new BlockContentControl({
                tag: "InnerControl",
                children: [new Paragraph("Inner")],
            });

            const outerControl = new BlockContentControl({
                tag: "OuterControl",
                children: [innerControl],
            });

            const tree = new Formatter().format(outerControl);

            // Get outer control ID
            const outerSdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const outerIdElement = outerSdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"]);
            const outerId = outerIdElement["w:id"]._attr["w:val"];

            // Get inner control ID
            const outerSdtContent = tree["w:sdt"][1]["w:sdtContent"];
            const innerSdt = outerSdtContent[0]["w:sdt"];
            const innerSdtPr = innerSdt[0]["w:sdtPr"];
            const innerIdElement = innerSdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"]);
            const innerId = innerIdElement["w:id"]._attr["w:val"];

            // IDs should be different
            expect(outerId).not.to.equal(innerId);
        });
    });

    describe("Enhanced Properties", () => {
        it("should handle appearance property", () => {
            const control = new BlockContentControl({
                tag: "AppearanceTest",
                appearance: "hidden",
                children: [new Paragraph("Test content")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const appearanceElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"]);
            expect(appearanceElement).to.exist;
            expect(appearanceElement["w:appearance"]._attr["w:val"]).to.equal("hidden");
        });

        it("should handle appearance: 'hidden' property correctly in BlockContentControl", () => {
            const control = new BlockContentControl({
                tag: "HiddenBlockAppearanceTest",
                appearance: "hidden",
                children: [new Paragraph("This block should be hidden"), new Paragraph("Second paragraph in hidden block")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Check that appearance element exists with hidden value
            const appearanceElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"]);
            expect(appearanceElement).to.exist;
            expect(appearanceElement["w:appearance"]._attr["w:val"]).to.equal("hidden");

            // Verify full XML structure is correct
            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.length(2);
        });

        it("should test all appearance values for BlockContentControl XML generation", () => {
            const appearances = ["boundingBox", "tags", "hidden"];

            appearances.forEach((appearance) => {
                const control = new BlockContentControl({
                    tag: `BlockTest_${appearance}`,
                    appearance: appearance as "boundingBox" | "tags" | "hidden",
                    children: [new Paragraph(`Block content for ${appearance}`)],
                });

                const tree = new Formatter().format(control);
                const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
                const appearanceElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"]);

                expect(appearanceElement).to.exist;
                expect(appearanceElement["w:appearance"]._attr["w:val"]).to.equal(appearance);

                // Verify XML structure is consistent across all appearances
                expect(tree["w:sdt"]).to.have.length(2);
                expect(sdtPr).to.be.an("array");
            });
        });

        it("should handle color property", () => {
            const control = new BlockContentControl({
                tag: "ColorTest",
                color: "009900",
                children: [new Paragraph("Green border block")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const colorElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"]);
            expect(colorElement).to.exist;
            expect(colorElement["w:color"]._attr["w:val"]).to.equal("009900");
        });

        it("should handle data binding property", () => {
            const control = new BlockContentControl({
                tag: "DataBoundBlock",
                dataBinding: {
                    xpath: "/root/address/block",
                    storeItemId: "{98765432-1234-5678-9abc-def123456789}",
                },
                children: [new Paragraph("Address Line 1"), new Paragraph("Address Line 2")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const dataBindingElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:dataBinding"]);
            expect(dataBindingElement).to.exist;
            expect(dataBindingElement["w:dataBinding"]._attr["w:xpath"]).to.equal("/root/address/block");
            expect(dataBindingElement["w:dataBinding"]._attr["w:storeItemID"]).to.equal("{98765432-1234-5678-9abc-def123456789}");
        });

        it("should handle all enhanced properties for block control", () => {
            const control = new BlockContentControl({
                tag: "CompleteBlock",
                title: "Complete Block Control",
                appearance: "boundingBox",
                color: "FF6600",
                dataBinding: {
                    xpath: "/document/section",
                    storeItemId: "{aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee}",
                },
                children: [
                    new Paragraph("Enhanced block content"),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Table data")],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have all enhanced properties
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:alias"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:richText"])).to.exist;

            // Verify specific values
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"])["w:appearance"]._attr["w:val"]).to.equal(
                "boundingBox",
            );
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"])["w:color"]._attr["w:val"]).to.equal("FF6600");
        });

        it("should maintain rich text marker for enhanced block controls", () => {
            const control = new BlockContentControl({
                tag: "EnhancedBlock",
                appearance: "tags",
                children: [new Paragraph("Test")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have richText element (for block controls)
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:richText"])).to.exist;
            // Should NOT have text element (that's for run controls)
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:text"])).to.not.exist;
        });

        it("should handle lock properties", () => {
            const control = new BlockContentControl({
                tag: "LockedBlock",
                lock: {
                    contentLock: true,
                    sdtLocked: true,
                },
                children: [new Paragraph("Locked block content")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const lockElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:lock"]);
            expect(lockElement).to.exist;
            expect(lockElement["w:lock"]._attr["w:contentLocked"]).to.equal("1");
            expect(lockElement["w:lock"]._attr["w:sdtLocked"]).to.equal("1");
        });

        it("should handle placeholder property", () => {
            const control = new BlockContentControl({
                tag: "PlaceholderBlock",
                placeholder: "Click here to enter section content",
                children: [new Paragraph("Default paragraph 1"), new Paragraph("Default paragraph 2")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const placeholderElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
            expect(placeholderElement["w:showingPlcHdr"]).to.deep.equal({});
        });

        it("should handle all Phase 2A properties for block controls", () => {
            const control = new BlockContentControl({
                tag: "CompleteBlockPhase2A",
                title: "Complete Block Phase 2A",
                appearance: "tags",
                color: "990099",
                lock: {
                    contentLock: true,
                    sdtLocked: false,
                },
                placeholder: "Enter block content here",
                dataBinding: {
                    xpath: "/root/section",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789004}",
                },
                children: [
                    new Paragraph("Block content paragraph"),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Table content")],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Verify all block-appropriate properties are present
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:alias"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:lock"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:richText"])).to.exist;

            // Should NOT have text-specific properties (those are for RunContentControl only)
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:text"])).to.not.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:rPr"])).to.not.exist;
        });
    });
});

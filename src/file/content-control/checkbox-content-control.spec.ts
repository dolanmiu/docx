/* eslint-disable @typescript-eslint/no-explicit-any, functional/prefer-readonly-type */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { CheckboxContentControl } from "./checkbox-content-control";

// Mock context for XML validation
const mockContext = { stack: [] } as Record<string, unknown>;

describe("CheckboxContentControl", () => {
    beforeEach(() => {
        // Mock the numeric ID creator to return a predictable function
        vi.spyOn(convenienceFunctions, "uniqueNumericIdCreator").mockReturnValue(() => 444555666);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const control = new CheckboxContentControl({
                tag: "TestCheckbox",
                children: [],
            });
            const stringifiedJson = JSON.stringify(control);

            // Should not throw
            expect(() => JSON.parse(stringifiedJson)).not.toThrow();
        });

        it("should throw error for empty tag", () => {
            expect(
                () =>
                    new CheckboxContentControl({
                        tag: "", // Empty tag should throw validation error
                        children: [],
                    }),
            ).toThrow("CheckboxContentControl: 'tag' is required and cannot be empty");
        });

        it("should use default values", () => {
            const control = new CheckboxContentControl({
                tag: "DefaultsTest",
                children: [],
            });

            // Should use default values
            expect((control as any).checked).to.equal(false);
            expect((control as any).checkedSymbol.font).to.equal("MS Gothic");
            expect((control as any).checkedSymbol.character).to.equal("2612");
            expect((control as any).uncheckedSymbol.font).to.equal("MS Gothic");
            expect((control as any).uncheckedSymbol.character).to.equal("2610");
        });

        it("should handle custom symbols", () => {
            const control = new CheckboxContentControl({
                tag: "CustomSymbols",
                checkedSymbol: { font: "Wingdings", character: "☑" },
                uncheckedSymbol: { font: "Wingdings", character: "☐" },
                children: [],
            });

            expect((control as any).checkedSymbol.font).to.equal("Wingdings");
            expect((control as any).checkedSymbol.character).to.equal("☑");
            expect((control as any).uncheckedSymbol.font).to.equal("Wingdings");
            expect((control as any).uncheckedSymbol.character).to.equal("☐");
        });

        it("should throw error for invalid symbol configuration", () => {
            expect(
                () =>
                    new CheckboxContentControl({
                        tag: "InvalidSymbol",
                        checkedSymbol: { font: "", character: "☑" }, // Empty font
                        children: [],
                    }),
            ).toThrow("CheckboxContentControl: 'checkedSymbol' must have both 'font' and 'character' properties");
        });
    });

    describe("#prepForXml()", () => {
        it("should generate correct OOXML structure", () => {
            const control = new CheckboxContentControl({
                tag: "BasicCheckbox",
                title: "Basic Checkbox",
                checked: true,
                children: [],
            });

            const tree = new Formatter().format(control);

            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.lengthOf(2);

            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have checkbox element (w14 namespace)
            const checkboxElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w14:checkbox"]);
            expect(checkboxElement).to.exist;

            const checkboxContent = (checkboxElement as Record<string, unknown>)["w14:checkbox"];
            expect(
                (checkboxContent as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:checked"])["w14:checked"]._attr[
                    "w14:val"
                ],
            ).to.equal("1");
        });

        it("should generate correct checked state", () => {
            const checkedControl = new CheckboxContentControl({
                tag: "CheckedBox",
                checked: true,
                children: [],
            });

            const uncheckedControl = new CheckboxContentControl({
                tag: "UncheckedBox",
                checked: false,
                children: [],
            });

            const checkedTree = new Formatter().format(checkedControl);
            const uncheckedTree = new Formatter().format(uncheckedControl);

            const checkedSdtPr = checkedTree["w:sdt"][0]["w:sdtPr"];
            const uncheckedSdtPr = uncheckedTree["w:sdt"][0]["w:sdtPr"];

            const checkedElement = (
                checkedSdtPr.find((el: unknown) => (el as Record<string, unknown>)["w14:checkbox"]) as Record<string, unknown>
            )["w14:checkbox"];
            const uncheckedElement = (
                uncheckedSdtPr.find((el: unknown) => (el as Record<string, unknown>)["w14:checkbox"]) as Record<string, unknown>
            )["w14:checkbox"];

            expect(
                (checkedElement as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:checked"])["w14:checked"]._attr[
                    "w14:val"
                ],
            ).to.equal("1");
            expect(
                (uncheckedElement as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:checked"])["w14:checked"]._attr[
                    "w14:val"
                ],
            ).to.equal("0");
        });

        it("should generate correct symbol configurations", () => {
            const control = new CheckboxContentControl({
                tag: "SymbolTest",
                checkedSymbol: { font: "Wingdings", character: "☑" },
                uncheckedSymbol: { font: "Arial Unicode MS", character: "☐" },
                children: [],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const checkboxElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w14:checkbox"]);
            const checkboxContent = (checkboxElement as Record<string, unknown>)["w14:checkbox"];

            const checkedState = (checkboxContent as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:checkedState"]);
            const checkedStateElements = (checkedState as Record<string, unknown>)["w14:checkedState"];
            const checkedFont = (checkedStateElements as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:font"]);
            const checkedVal = (checkedStateElements as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:val"]);
            expect((checkedVal as any)["w14:val"]._attr["w14:val"]).to.equal("☑");
            expect((checkedFont as any)["w14:font"]._attr["w14:val"]).to.equal("Wingdings");

            const uncheckedState = (checkboxContent as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:uncheckedState"]);
            const uncheckedStateElements = (uncheckedState as Record<string, unknown>)["w14:uncheckedState"];
            const uncheckedFont = (uncheckedStateElements as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:font"]);
            const uncheckedVal = (uncheckedStateElements as any[]).find((el: unknown) => (el as Record<string, unknown>)["w14:val"]);
            expect((uncheckedVal as any)["w14:val"]._attr["w14:val"]).to.equal("☐");
            expect((uncheckedFont as any)["w14:font"]._attr["w14:val"]).to.equal("Arial Unicode MS");
        });

        it("should handle all enhanced properties", () => {
            const control = new CheckboxContentControl({
                tag: "EnhancedCheckbox",
                title: "Enhanced Checkbox",
                checked: true,
                appearance: "tags",
                color: "FF6600",
                lock: { sdtLocked: true },
                placeholder: "Checkbox placeholder",
                dataBinding: {
                    xpath: "/form/approved",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789002}",
                },
                children: [],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Verify all enhanced properties are present
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:alias"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:lock"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w14:checkbox"])).to.exist;
        });

        it("should include standard content control properties", () => {
            const control = new CheckboxContentControl({
                tag: "StandardProps",
                title: "Standard Properties",
                children: [],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            const tagElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"]);
            expect(tagElement).to.exist;
            expect(tagElement["w:tag"]._attr["w:val"]).to.equal("StandardProps");

            const aliasElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:alias"]);
            expect(aliasElement).to.exist;
            expect(aliasElement["w:alias"]._attr["w:val"]).to.equal("Standard Properties");

            const idElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"]);
            expect(idElement).to.exist;

            const id = parseInt(idElement["w:id"]._attr["w:val"], 10);
            expect(id).to.be.a("number");
            expect(id).to.be.greaterThan(0);
        });
    });

    describe("Validation", () => {
        it("should validate symbol configurations", () => {
            expect(
                () =>
                    new CheckboxContentControl({
                        tag: "InvalidCheckedSymbol",
                        checkedSymbol: { font: "", character: "☑" }, // Empty font
                        children: [],
                    }),
            ).toThrow("'checkedSymbol' must have both 'font' and 'character' properties");

            expect(
                () =>
                    new CheckboxContentControl({
                        tag: "InvalidUncheckedSymbol",
                        uncheckedSymbol: { font: "Wingdings", character: "" }, // Empty character
                        children: [],
                    }),
            ).toThrow("'uncheckedSymbol' must have both 'font' and 'character' properties");
        });

        it("should validate children array type", () => {
            expect(
                () =>
                    new CheckboxContentControl({
                        tag: "InvalidChildren",
                        // @ts-expect-error Testing invalid type
                        children: "not an array",
                    }),
            ).toThrow("'children' must be an array");
        });
    });

    describe("Real-world Use Cases", () => {
        it("should create agreement checkbox", () => {
            const agreementCheckbox = new CheckboxContentControl({
                tag: "TermsAgreement",
                title: "Terms and Conditions Agreement",
                checked: false,
                appearance: "boundingBox",
                color: "FF0000",
                lock: { sdtLocked: true },
                children: [],
            });

            expect(() => new Formatter().format(agreementCheckbox)).not.toThrow();
        });

        it("should create approval status checkbox", () => {
            const approvalCheckbox = new CheckboxContentControl({
                tag: "DocumentApproval",
                title: "Document Approval Status",
                checked: true,
                checkedSymbol: { font: "Segoe UI Symbol", character: "✓" },
                uncheckedSymbol: { font: "Segoe UI Symbol", character: "□" },
                dataBinding: {
                    xpath: "/document/approved",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789003}",
                },
                children: [],
            });

            expect(() => new Formatter().format(approvalCheckbox)).not.toThrow();
        });

        it("should include appearance when provided", () => {
            const checkbox = new CheckboxContentControl({
                tag: "Test",
                appearance: "tags",
                children: [],
            });

            const tree = new Formatter().format(checkbox);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const appearanceElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"]);
            expect(appearanceElement).to.exist;
        });

        it("should include color when provided", () => {
            const checkbox = new CheckboxContentControl({
                tag: "Test",
                color: "FF0000",
                children: [],
            });

            const tree = new Formatter().format(checkbox);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const colorElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"]);
            expect(colorElement).to.exist;
        });

        it("should include placeholder when provided", () => {
            const checkbox = new CheckboxContentControl({
                tag: "Test",
                placeholder: "Check this box",
                children: [],
            });

            const tree = new Formatter().format(checkbox);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const placeholderElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
        });
    });

    describe("XML Structure Validation - Critical Namespace Tests", () => {
        let formatter: Formatter;

        beforeEach(() => {
            formatter = new Formatter();
        });

        it("should generate correct w14:checkbox namespace structure (regression test)", () => {
            const control = new CheckboxContentControl({
                tag: "CheckboxTest",
                checked: true,
                children: [], // Required for checkboxes
            });

            const xmlTree = formatter.format(control, mockContext as any);

            // Core structure validation
            expect(xmlTree).to.have.property("w:sdt");
            expect(xmlTree["w:sdt"]).to.be.an("array");
            expect(xmlTree["w:sdt"]).to.have.length(2);

            // Extract sdtPr section
            const sdtPr = xmlTree["w:sdt"][0]["w:sdtPr"];
            expect(sdtPr).to.be.an("array");

            // Find the w14:checkbox element (this was our bug!)
            const checkboxElement = sdtPr.find((prop: unknown) => (prop as Record<string, unknown>)["w14:checkbox"]);
            expect(checkboxElement).to.exist;
            expect(checkboxElement["w14:checkbox"]).to.be.an("array");

            // Validate w14:checkbox structure
            const checkboxProps = checkboxElement["w14:checkbox"];

            // Should contain w14:checked
            const checkedProp = checkboxProps.find((prop: unknown) => (prop as Record<string, unknown>)["w14:checked"]);
            expect(checkedProp).to.exist;
            expect(checkedProp["w14:checked"]._attr["w14:val"]).to.equal("1");

            // Should contain w14:checkedState with nested structure
            const checkedState = checkboxProps.find((prop: unknown) => (prop as Record<string, unknown>)["w14:checkedState"]);
            expect(checkedState).to.exist;
            expect(checkedState["w14:checkedState"]).to.be.an("array");

            const checkedStateProps = checkedState["w14:checkedState"];
            const fontProp = checkedStateProps.find((prop: unknown) => (prop as Record<string, unknown>)["w14:font"]);
            const valProp = checkedStateProps.find((prop: unknown) => (prop as Record<string, unknown>)["w14:val"]);

            expect(fontProp).to.exist;
            expect(valProp).to.exist;
            expect(fontProp["w14:font"]._attr["w14:val"]).to.be.a("string");
            expect(valProp["w14:val"]._attr["w14:val"]).to.be.a("string");
        });

        it("should generate correct unchecked state with w14: namespace", () => {
            const control = new CheckboxContentControl({
                tag: "UncheckedTest",
                checked: false,
                children: [], // Required for checkboxes
            });

            const xmlTree = formatter.format(control, mockContext as any);
            const xmlString = JSON.stringify(xmlTree);

            // Should use w14: namespace consistently
            expect(xmlString).to.include("w14:checkbox");
            expect(xmlString).to.include("w14:checked");
            expect(xmlString).to.include("w14:checkedState");
            expect(xmlString).to.include("w14:uncheckedState");
            expect(xmlString).to.include("w14:font");
            expect(xmlString).to.include("w14:val");

            // Find checked value should be "0"
            const sdtPr = xmlTree["w:sdt"][0]["w:sdtPr"];
            const checkboxElement = sdtPr.find((prop: unknown) => (prop as Record<string, unknown>)["w14:checkbox"]);
            const checkedProp = checkboxElement["w14:checkbox"].find((prop: unknown) => (prop as Record<string, unknown>)["w14:checked"]);
            expect(checkedProp["w14:checked"]._attr["w14:val"]).to.equal("0");
        });

        it("should never generate malformed checkbox XML (rootKey regression test)", () => {
            const control = new CheckboxContentControl({
                tag: "MalformTest",
                checked: true,
                checkedSymbol: { font: "Wingdings", character: "☑" },
                uncheckedSymbol: { font: "Wingdings", character: "☐" },
                children: [], // Required for checkboxes
            });

            const xmlTree = formatter.format(control, mockContext as any);
            const xmlString = JSON.stringify(xmlTree);

            // Should NOT contain rootKey (our previous bug)
            expect(xmlString).not.to.include("rootKey");
            expect(xmlString).not.to.include("<rootKey>");

            // Should contain proper OOXML structure
            expect(xmlString).to.include("w:sdt");
            expect(xmlString).to.include("w:sdtPr");
            expect(xmlString).to.include("w:sdtContent");
            expect(xmlString).to.include("w14:checkbox");
        });

        it("should match existing CheckBox XML structure pattern", () => {
            // This test ensures our CheckboxContentControl generates the same
            // w14:checkbox structure as the existing CheckBox component
            const control = new CheckboxContentControl({
                tag: "CompatibilityTest",
                checked: true,
                checkedSymbol: { font: "Segoe UI Symbol", character: "☑" },
                uncheckedSymbol: { font: "Segoe UI Symbol", character: "☐" },
                children: [], // Required for checkboxes
            });

            const xmlTree = formatter.format(control, mockContext as any);

            // Extract the checkbox-specific XML
            const sdtPr = xmlTree["w:sdt"][0]["w:sdtPr"];
            const checkboxElement = sdtPr.find((prop: unknown) => (prop as Record<string, unknown>)["w14:checkbox"]);

            // Validate structure matches working CheckBox pattern
            expect(checkboxElement["w14:checkbox"]).to.be.an("array");
            expect(checkboxElement["w14:checkbox"]).to.have.length(3); // checked, checkedState, uncheckedState

            const checkboxProps = checkboxElement["w14:checkbox"];

            // Validate exact structure
            const checked = checkboxProps.find((p: unknown) => (p as Record<string, unknown>)["w14:checked"]);
            const checkedState = checkboxProps.find((p: unknown) => (p as Record<string, unknown>)["w14:checkedState"]);
            const uncheckedState = checkboxProps.find((p: unknown) => (p as Record<string, unknown>)["w14:uncheckedState"]);

            expect(checked).to.exist;
            expect(checkedState).to.exist;
            expect(uncheckedState).to.exist;

            // Both states should have font and val nested elements
            expect(checkedState["w14:checkedState"]).to.have.length(2);
            expect(uncheckedState["w14:uncheckedState"]).to.have.length(2);
        });

        it("should handle custom symbols in XML correctly", () => {
            const control = new CheckboxContentControl({
                tag: "CustomSymbolTest",
                checked: false,
                checkedSymbol: { font: "Arial", character: "✓" },
                uncheckedSymbol: { font: "Arial", character: "○" },
                children: [], // Required for checkboxes
            });

            const xmlTree = formatter.format(control, mockContext as any);

            // Extract symbol information from XML
            const sdtPr = xmlTree["w:sdt"][0]["w:sdtPr"];
            const checkboxElement = sdtPr.find((prop: unknown) => (prop as Record<string, unknown>)["w14:checkbox"]);
            const checkboxProps = checkboxElement["w14:checkbox"];

            const checkedState = checkboxProps.find((p: unknown) => (p as Record<string, unknown>)["w14:checkedState"]);
            const uncheckedState = checkboxProps.find((p: unknown) => (p as Record<string, unknown>)["w14:uncheckedState"]);

            // Verify custom font is preserved
            const checkedFont = checkedState["w14:checkedState"].find((p: unknown) => (p as Record<string, unknown>)["w14:font"]);
            const uncheckedFont = uncheckedState["w14:uncheckedState"].find((p: unknown) => (p as Record<string, unknown>)["w14:font"]);

            expect(checkedFont["w14:font"]._attr["w14:val"]).to.equal("Arial");
            expect(uncheckedFont["w14:font"]._attr["w14:val"]).to.equal("Arial");

            // Verify custom characters are preserved
            const checkedChar = checkedState["w14:checkedState"].find((p: unknown) => (p as Record<string, unknown>)["w14:val"]);
            const uncheckedChar = uncheckedState["w14:uncheckedState"].find((p: unknown) => (p as Record<string, unknown>)["w14:val"]);

            expect(checkedChar["w14:val"]._attr["w14:val"]).to.equal("✓");
            expect(uncheckedChar["w14:val"]._attr["w14:val"]).to.equal("○");
        });

        it("should maintain checkbox XML structure integrity under nesting", () => {
            const nestedCheckbox = new CheckboxContentControl({
                tag: "NestedCheckbox",
                checked: true,
                children: [], // Required for checkboxes
            });

            // Create outer control that contains this checkbox
            // (This would be handled by a BlockContentControl in practice)
            const xmlTree = formatter.format(nestedCheckbox, mockContext as any);
            const xmlString = JSON.stringify(xmlTree);

            // Even when nested, should maintain w14: namespace integrity
            expect(xmlString).to.include("w14:checkbox");
            expect(xmlString).to.include("w14:checked");
            expect(xmlString).to.include("w14:checkedState");
            expect(xmlString).to.include("w14:uncheckedState");

            // Should not have namespace conflicts
            expect(xmlString).not.to.include("w:checkbox"); // Should be w14:, not w:
            expect(xmlString).not.to.include("checkbox:"); // Should not have bare namespace
        });
    });
});

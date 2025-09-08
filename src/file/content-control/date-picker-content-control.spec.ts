/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { TextRun } from "../paragraph";
import { DatePickerContentControl } from "./date-picker-content-control";

describe("DatePickerContentControl", () => {
    beforeEach(() => {
        // Mock the numeric ID creator to return a predictable function
        vi.spyOn(convenienceFunctions, "uniqueNumericIdCreator").mockReturnValue(() => 999888777);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const control = new DatePickerContentControl({
                tag: "TestDatePicker",
                children: [new TextRun("12/31/2024")],
            });
            const stringifiedJson = JSON.stringify(control);

            // Should not throw
            expect(() => JSON.parse(stringifiedJson)).not.toThrow();
        });

        it("should throw error for empty tag", () => {
            expect(
                () =>
                    new DatePickerContentControl({
                        tag: "", // Empty tag should throw validation error
                        children: [new TextRun("12/31/2024")],
                    }),
            ).toThrow("DatePickerContentControl: 'tag' is required and cannot be empty");
        });

        it("should throw error for empty children", () => {
            expect(
                () =>
                    new DatePickerContentControl({
                        tag: "ValidTag",
                        children: [], // Empty children should throw validation error
                    }),
            ).toThrow("DatePickerContentControl: 'children' array is required");
        });

        it("should use default values", () => {
            const control = new DatePickerContentControl({
                tag: "DefaultsTest",
                children: [new TextRun("12/31/2024")],
            });

            // Access private properties for testing (this is implementation detail testing)
            expect((control as any).dateFormat).to.equal("MM/dd/yyyy");
            expect((control as any).calendarType).to.equal("gregorian");
            expect((control as any).locale).to.equal("en-US");
            expect((control as any).storeMappedDataAs).to.equal("text");
        });
    });

    describe("#prepForXml()", () => {
        it("should generate correct OOXML structure", () => {
            const control = new DatePickerContentControl({
                tag: "TestDatePicker",
                title: "Test Date Picker",
                dateFormat: "dd/MM/yyyy",
                calendarType: "gregorian",
                locale: "en-GB",
                children: [new TextRun("31/12/2024")],
            });

            const tree = new Formatter().format(control);

            expect(tree).to.have.property("w:sdt");
            expect(tree["w:sdt"]).to.be.an("array");
            expect(tree["w:sdt"]).to.have.lengthOf(2);

            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Should have date element
            const dateElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:date"]);
            expect(dateElement).to.exist;

            const dateContent = dateElement["w:date"];
            expect(
                dateContent.find((el: unknown) => (el as Record<string, unknown>)["w:dateFormat"])["w:dateFormat"]._attr["w:val"],
            ).to.equal("dd/MM/yyyy");
            expect(dateContent.find((el: unknown) => (el as Record<string, unknown>)["w:calendar"])["w:calendar"]._attr["w:val"]).to.equal(
                "gregorian",
            );
            expect(dateContent.find((el: unknown) => (el as Record<string, unknown>)["w:lid"])["w:lid"]._attr["w:val"]).to.equal("en-GB");
        });

        it("should handle default date value", () => {
            const testDate = new Date(2024, 11, 31); // December 31, 2024
            const control = new DatePickerContentControl({
                tag: "DefaultDateTest",
                defaultDate: testDate,
                children: [new TextRun("12/31/2024")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const dateElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:date"]);
            const dateContent = dateElement["w:date"];

            const fullDateElement = dateContent.find((el: unknown) => (el as Record<string, unknown>)["w:fullDate"]);
            expect(fullDateElement).to.exist;
            expect(fullDateElement["w:fullDate"]._attr["w:val"]).to.equal(testDate.toISOString());
        });

        it("should include appearance when provided", () => {
            const control = new DatePickerContentControl({
                tag: "Test",
                appearance: "tags",
                children: [new TextRun("Date")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const appearanceElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"]);
            expect(appearanceElement).to.exist;
        });

        it("should include color when provided", () => {
            const control = new DatePickerContentControl({
                tag: "Test",
                color: "0000FF",
                children: [new TextRun("Date")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const colorElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"]);
            expect(colorElement).to.exist;
        });

        it("should include placeholder when provided", () => {
            const control = new DatePickerContentControl({
                tag: "Test",
                placeholder: "Select a date",
                children: [new TextRun("Date")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const placeholderElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"]);
            expect(placeholderElement).to.exist;
        });

        it("should include lock properties when provided", () => {
            const control = new DatePickerContentControl({
                tag: "Test",
                lock: { sdtLocked: true, contentLock: false },
                children: [new TextRun("Date")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];
            const lockElement = sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:lock"]);
            expect(lockElement).to.exist;
        });

        it("should handle all enhanced properties", () => {
            const control = new DatePickerContentControl({
                tag: "EnhancedDatePicker",
                title: "Enhanced Date Picker",
                dateFormat: "yyyy-MM-dd",
                calendarType: "gregorian",
                locale: "fr-FR",
                storeMappedDataAs: "dateTime",
                appearance: "tags",
                color: "FF6600",
                lock: { sdtLocked: true },
                placeholder: "Select a date",
                dataBinding: {
                    xpath: "/dates/selected",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789006}",
                },
                children: [new TextRun("2024-12-31")],
            });

            const tree = new Formatter().format(control);
            const sdtPr = tree["w:sdt"][0]["w:sdtPr"];

            // Verify all properties are present
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:alias"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:tag"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:id"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:appearance"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:color"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:lock"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:showingPlcHdr"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:dataBinding"])).to.exist;
            expect(sdtPr.find((el: unknown) => (el as Record<string, unknown>)["w:date"])).to.exist;
        });
    });

    describe("Validation", () => {
        it("should validate calendarType values", () => {
            expect(
                () =>
                    new DatePickerContentControl({
                        tag: "InvalidCalendar",
                        calendarType: "invalid" as any,
                        children: [new TextRun("Date")],
                    }),
            ).toThrow("DatePickerContentControl: 'calendarType' must be one of: gregorian, hijri, hebrew, taiwan");
        });

        it("should validate storeMappedDataAs values", () => {
            expect(
                () =>
                    new DatePickerContentControl({
                        tag: "InvalidStorage",
                        storeMappedDataAs: "invalid" as any,
                        children: [new TextRun("Date")],
                    }),
            ).toThrow("DatePickerContentControl: 'storeMappedDataAs' must be one of: text, date, dateTime");
        });
    });
});

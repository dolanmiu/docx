/**
 * Tests for Content Control validation utilities
 */

import { describe, expect, it } from "vitest";

import { GuidValidator, validateDataBinding } from "./validation-utils";

describe("GuidValidator", () => {
    describe("isValidGuid", () => {
        it("should validate correct GUID formats", () => {
            expect(GuidValidator.isValidGuid("{12345678-1234-5678-9ABC-123456789012}")).toBe(true);
            expect(GuidValidator.isValidGuid("{ABCDEF12-3456-7890-ABCD-ABCDEF123456}")).toBe(true);
            expect(GuidValidator.isValidGuid("{abcdef12-3456-7890-abcd-abcdef123456}")).toBe(true);
            expect(GuidValidator.isValidGuid("{00000000-0000-0000-0000-000000000000}")).toBe(true);
            expect(GuidValidator.isValidGuid("{FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF}")).toBe(true);
        });

        it("should reject invalid GUID formats", () => {
            // Missing braces
            expect(GuidValidator.isValidGuid("12345678-1234-5678-9ABC-123456789012")).toBe(false);

            // Invalid GUID like the one that caused corruption
            expect(GuidValidator.isValidGuid("{approval-guid}")).toBe(false);

            // Too short
            expect(GuidValidator.isValidGuid("{1234-5678-9ABC}")).toBe(false);

            // Wrong separator
            expect(GuidValidator.isValidGuid("{12345678_1234_5678_9ABC_123456789012}")).toBe(false);

            // Invalid characters
            expect(GuidValidator.isValidGuid("{GGGGGGGG-1234-5678-9ABC-123456789012}")).toBe(false);

            // Empty
            expect(GuidValidator.isValidGuid("")).toBe(false);
            expect(GuidValidator.isValidGuid("{}")).toBe(false);
        });
    });

    describe("validateGuid", () => {
        it("should not throw for valid GUIDs", () => {
            expect(() => {
                GuidValidator.validateGuid("{12345678-1234-5678-9ABC-123456789012}", "Test");
            }).not.toThrow();
        });

        it("should throw descriptive errors for invalid GUIDs", () => {
            expect(() => {
                GuidValidator.validateGuid("{approval-guid}", "TestContext");
            }).toThrow('TestContext: Invalid GUID format "{approval-guid}"');

            expect(() => {
                GuidValidator.validateGuid("not-a-guid");
            }).toThrow('Invalid GUID format "not-a-guid"');
        });

        it("should include prevention message about document corruption", () => {
            expect(() => {
                GuidValidator.validateGuid("{invalid-guid}", "Test");
            }).toThrow("prevents document corruption");
        });
    });

    describe("generateTestGuid", () => {
        it("should generate valid GUID format", () => {
            const guid = GuidValidator.generateTestGuid();
            expect(GuidValidator.isValidGuid(guid)).toBe(true);
        });

        it("should generate different GUIDs on each call", () => {
            const guid1 = GuidValidator.generateTestGuid();
            const guid2 = GuidValidator.generateTestGuid();
            expect(guid1).not.toBe(guid2);
        });
    });
});

describe("validateDataBinding", () => {
    it("should validate correct data binding", () => {
        expect(() => {
            validateDataBinding(
                {
                    xpath: "/root/element",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789012}",
                },
                "TestControl",
            );
        }).not.toThrow();
    });

    it("should throw for empty xpath", () => {
        expect(() => {
            validateDataBinding(
                {
                    xpath: "",
                    storeItemId: "{12345678-1234-5678-9ABC-123456789012}",
                },
                "TestControl",
            );
        }).toThrow("TestControl: dataBinding.xpath cannot be empty");
    });

    it("should throw for invalid GUID in storeItemId", () => {
        expect(() => {
            validateDataBinding(
                {
                    xpath: "/root/element",
                    storeItemId: "{approval-guid}",
                },
                "TestControl",
            );
        }).toThrow("TestControl dataBinding.storeItemId: Invalid GUID format");
    });
});

/**
 * Validation utilities for Content Control properties
 */

/**
 * GUID validation utilities to prevent document corruption from invalid GUID formats
 */
export class GuidValidator {
    private static readonly GUID_REGEX = /^{[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}}$/;

    /**
     * Validates if a string is a properly formatted GUID
     * @param guid - The GUID string to validate
     * @returns true if valid, false otherwise
     */
    public static isValidGuid(guid: string): boolean {
        return this.GUID_REGEX.test(guid);
    }

    /**
     * Validates and throws descriptive error for invalid GUID
     * @param guid - The GUID to validate
     * @param context - Context for error message
     * @throws Error if GUID is invalid
     */
    public static validateGuid(guid: string, context: string = "GUID"): void {
        if (!this.isValidGuid(guid)) {
            throw new Error(
                `${context}: Invalid GUID format "${guid}". ` +
                    `GUIDs must follow the format {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX} where X is a hexadecimal digit. ` +
                    `Example: "{12345678-1234-5678-9ABC-123456789012}". ` +
                    `This validation prevents document corruption that occurs with invalid GUID formats.`,
            );
        }
    }

    /**
     * Generates a random valid GUID for testing purposes
     * @returns A properly formatted GUID string
     */
    public static readonly generateTestGuid = (): string => {
        const hex = (): string =>
            Math.floor(Math.random() * 16)
                .toString(16)
                .toUpperCase();
        const guid =
            `{${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}-` +
            `${hex()}${hex()}${hex()}${hex()}-` +
            `${hex()}${hex()}${hex()}${hex()}-` +
            `${hex()}${hex()}${hex()}${hex()}-` +
            `${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}}`;
        return guid;
    };
}

/**
 * Enhanced validation for data binding properties
 * This prevents document corruption from invalid GUID formats in storeItemId
 */
export const validateDataBinding = (dataBinding: { readonly xpath: string; readonly storeItemId: string }, context: string): void => {
    // Validate xpath is not empty
    if (!dataBinding.xpath || dataBinding.xpath.trim().length === 0) {
        throw new Error(`${context}: dataBinding.xpath cannot be empty. ` + `Provide a valid XPath expression like "/root/element"`);
    }

    // Validate storeItemId is a proper GUID - THIS IS CRITICAL!
    // Invalid GUID formats cause Word documents to become corrupted and unreadable
    GuidValidator.validateGuid(dataBinding.storeItemId, `${context} dataBinding.storeItemId`);
};

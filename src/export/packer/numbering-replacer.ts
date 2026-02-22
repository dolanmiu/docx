/**
 * Numbering replacer module for substituting numbering placeholders in XML.
 *
 * @module
 */
import type { ConcreteNumbering } from "@file/numbering";

/**
 * Replaces numbering instance placeholders with actual numbering IDs in XML content.
 *
 * Numbering instances (for bullets and numbered lists) use placeholder tokens during
 * compilation. This class replaces those placeholders with the final numbering IDs
 * that reference the numbering definitions in numbering.xml.
 *
 * @example
 * ```typescript
 * const replacer = new NumberingReplacer();
 * const updatedXml = replacer.replace(xmlString, concreteNumberings);
 * ```
 */
export class NumberingReplacer {
    /**
     * Replaces numbering placeholder tokens with actual numbering IDs.
     *
     * Placeholder format: {reference-instance} where reference identifies the
     * numbering definition and instance is the specific usage.
     *
     * @param xmlData - The XML string containing numbering placeholders
     * @param concreteNumberings - Array of concrete numbering instances to replace
     * @returns XML string with placeholders replaced by numbering IDs
     */
    public replace(xmlData: string, concreteNumberings: readonly ConcreteNumbering[]): string {
        let currentXmlData = xmlData;

        for (const concreteNumbering of concreteNumberings) {
            currentXmlData = currentXmlData.replace(
                new RegExp(`{${concreteNumbering.reference}-${concreteNumbering.instance}}`, "g"),
                concreteNumbering.numId.toString(),
            );
        }

        return currentXmlData;
    }
}

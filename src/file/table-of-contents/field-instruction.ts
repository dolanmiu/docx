/**
 * Field Instruction module for Table of Contents.
 *
 * This module handles the generation of TOC field instruction text
 * that controls how the table of contents is built.
 *
 * Reference: http://officeopenxml.com/WPfieldInstructions.php
 *
 * @module
 */
import { TextAttributes } from "@file/paragraph/run/text-attributes";
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import type { ITableOfContentsOptions } from "./table-of-contents-properties";

/**
 * Represents a field instruction for a Table of Contents.
 *
 * The FieldInstruction class generates the TOC field code string that Word uses
 * to determine how to build the table of contents, including which headings to include,
 * formatting options, and other TOC-specific settings.
 *
 * Reference: http://officeopenxml.com/WPfieldInstructions.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="instrText" type="CT_Text"/>
 * ```
 *
 * @example
 * ```typescript
 * // Basic TOC field instruction
 * new FieldInstruction({ headingStyleRange: "1-3" });
 *
 * // TOC with hyperlinks and custom styles
 * new FieldInstruction({
 *   hyperlink: true,
 *   headingStyleRange: "1-3",
 *   stylesWithLevels: [new StyleLevel("CustomStyle", 2)],
 * });
 * ```
 */
export class FieldInstruction extends XmlComponent {
    private readonly properties: ITableOfContentsOptions;

    public constructor(properties: ITableOfContentsOptions = {}) {
        super("w:instrText");

        this.properties = properties;

        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        let instruction = "TOC";

        if (this.properties.captionLabel) {
            instruction = `${instruction} \\a "${this.properties.captionLabel}"`;
        }
        if (this.properties.entriesFromBookmark) {
            instruction = `${instruction} \\b "${this.properties.entriesFromBookmark}"`;
        }
        if (this.properties.captionLabelIncludingNumbers) {
            instruction = `${instruction} \\c "${this.properties.captionLabelIncludingNumbers}"`;
        }
        if (this.properties.sequenceAndPageNumbersSeparator) {
            instruction = `${instruction} \\d "${this.properties.sequenceAndPageNumbersSeparator}"`;
        }
        if (this.properties.tcFieldIdentifier) {
            instruction = `${instruction} \\f "${this.properties.tcFieldIdentifier}"`;
        }
        if (this.properties.hyperlink) {
            instruction = `${instruction} \\h`;
        }
        if (this.properties.tcFieldLevelRange) {
            instruction = `${instruction} \\l "${this.properties.tcFieldLevelRange}"`;
        }
        if (this.properties.pageNumbersEntryLevelsRange) {
            instruction = `${instruction} \\n "${this.properties.pageNumbersEntryLevelsRange}"`;
        }
        if (this.properties.headingStyleRange) {
            instruction = `${instruction} \\o "${this.properties.headingStyleRange}"`;
        }
        if (this.properties.entryAndPageNumberSeparator) {
            instruction = `${instruction} \\p "${this.properties.entryAndPageNumberSeparator}"`;
        }
        if (this.properties.seqFieldIdentifierForPrefix) {
            instruction = `${instruction} \\s "${this.properties.seqFieldIdentifierForPrefix}"`;
        }
        if (this.properties.stylesWithLevels && this.properties.stylesWithLevels.length) {
            const styles = this.properties.stylesWithLevels.map((sl) => `${sl.styleName},${sl.level}`).join(",");
            instruction = `${instruction} \\t "${styles}"`;
        }
        if (this.properties.useAppliedParagraphOutlineLevel) {
            instruction = `${instruction} \\u`;
        }
        if (this.properties.preserveTabInEntries) {
            instruction = `${instruction} \\w`;
        }
        if (this.properties.preserveNewLineInEntries) {
            instruction = `${instruction} \\x`;
        }
        if (this.properties.hideTabAndPageNumbersInWebView) {
            instruction = `${instruction} \\z`;
        }
        this.root.push(instruction);
    }
}

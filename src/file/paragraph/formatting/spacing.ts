/**
 * Paragraph spacing module for WordprocessingML documents.
 *
 * This module provides spacing options for paragraphs including space before,
 * space after, and line spacing.
 *
 * Reference: http://officeopenxml.com/WPspacing.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Line spacing rule types.
 *
 * Specifies how the line height is calculated.
 *
 * @publicApi
 */
export const LineRuleType = {
    /** Line spacing is at least the specified value */
    AT_LEAST: "atLeast",
    /** Line spacing is exactly the specified value */
    EXACTLY: "exactly",
    /** Line spacing is exactly the specified value (alias for EXACTLY) */
    EXACT: "exact",
    /** Line spacing is automatically determined based on content */
    AUTO: "auto",
} as const;

/**
 * Properties for configuring paragraph spacing.
 *
 * All values are in twips (twentieths of a point) unless otherwise specified.
 *
 * @property after - Spacing after the paragraph in twips
 * @property before - Spacing before the paragraph in twips
 * @property line - Line spacing value in twips (interpretation depends on lineRule)
 * @property lineRule - How to interpret the line spacing value
 * @property beforeAutoSpacing - Use automatic spacing before the paragraph
 * @property afterAutoSpacing - Use automatic spacing after the paragraph
 */
export type ISpacingProperties = {
    /** Spacing after the paragraph in twips */
    readonly after?: number;
    /** Spacing before the paragraph in twips */
    readonly before?: number;
    /** Line spacing value in twips (interpretation depends on lineRule) */
    readonly line?: number;
    /** How to interpret the line spacing value */
    readonly lineRule?: (typeof LineRuleType)[keyof typeof LineRuleType];
    /** Use automatic spacing before the paragraph */
    readonly beforeAutoSpacing?: boolean;
    /** Use automatic spacing after the paragraph */
    readonly afterAutoSpacing?: boolean;
};

/**
 * Creates paragraph spacing element for a WordprocessingML document.
 *
 * The spacing element specifies the spacing between lines and paragraphs.
 *
 * Reference: http://officeopenxml.com/WPspacing.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Spacing">
 *   <xsd:attribute name="before" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="beforeLines" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="beforeAutospacing" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="after" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="afterLines" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="afterAutospacing" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="line" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="lineRule" type="ST_LineSpacingRule" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   spacing: {
 *     before: 200,
 *     after: 200,
 *     line: 360,
 *     lineRule: LineRuleType.AT_LEAST,
 *   },
 *   children: [new TextRun("Paragraph with custom spacing")],
 * });
 * ```
 */
export const createSpacing = ({ after, before, line, lineRule, beforeAutoSpacing, afterAutoSpacing }: ISpacingProperties): XmlComponent =>
    new BuilderElement<ISpacingProperties>({
        name: "w:spacing",
        attributes: {
            after: { key: "w:after", value: after },
            before: { key: "w:before", value: before },
            line: { key: "w:line", value: line },
            lineRule: { key: "w:lineRule", value: lineRule },
            beforeAutoSpacing: { key: "w:beforeAutospacing", value: beforeAutoSpacing },
            afterAutoSpacing: { key: "w:afterAutospacing", value: afterAutoSpacing },
        },
    });

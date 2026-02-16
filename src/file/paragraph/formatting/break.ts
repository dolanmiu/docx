/**
 * Break elements module for WordprocessingML documents.
 *
 * This module provides page break and column break functionality.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";

import { Run } from "../run";

/**
 * Break type values.
 * @internal
 */
const BreakType = {
    /** Column break - text continues at the beginning of the next column */
    COLUMN: "column",
    /** Page break - text continues at the beginning of the next page */
    PAGE: "page",
    // textWrapping breaks are the default and already exposed via the "Run" class
} as const;

/**
 * Represents a break element in a WordprocessingML document.
 * @internal
 */
class Break extends XmlComponent {
    public constructor(type: (typeof BreakType)[keyof typeof BreakType]) {
        super("w:br");
        this.root.push(
            new Attributes({
                type,
            }),
        );
    }
}

/**
 * Represents a page break in a WordprocessingML document.
 *
 * A page break forces text to continue at the beginning of the next page.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Br">
 *   <xsd:attribute name="type" type="ST_BrType" use="optional"/>
 *   <xsd:attribute name="clear" type="ST_BrClear" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [new PageBreak()],
 * });
 * ```
 */
export class PageBreak extends Run {
    public constructor() {
        super({});
        this.root.push(new Break(BreakType.PAGE));
    }
}

/**
 * Represents a column break in a WordprocessingML document.
 *
 * A column break forces text to continue at the beginning of the next column.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Br">
 *   <xsd:attribute name="type" type="ST_BrType" use="optional"/>
 *   <xsd:attribute name="clear" type="ST_BrClear" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [new ColumnBreak()],
 * });
 * ```
 */
export class ColumnBreak extends Run {
    public constructor() {
        super({});
        this.root.push(new Break(BreakType.COLUMN));
    }
}

/**
 * Represents a page break before setting for paragraph properties.
 *
 * When applied to a paragraph, ensures the paragraph begins on a new page.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   pageBreakBefore: true,
 *   children: [new TextRun("This text starts on a new page")],
 * });
 * ```
 */
export class PageBreakBefore extends XmlComponent {
    public constructor() {
        super("w:pageBreakBefore");
    }
}

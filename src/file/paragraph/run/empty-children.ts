/**
 * Empty children module for WordprocessingML run elements.
 *
 * This module provides support for various empty (self-closing) elements that can
 * appear within a run. These elements represent special characters, references,
 * and separators that don't require additional content.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { EmptyElement } from "@file/xml-components";

// XSD Schema reference for EG_RunInnerContent group:
// <xsd:group name="EG_RunInnerContent">
//   <xsd:element name="noBreakHyphen" type="CT_Empty"/>
//   <xsd:element name="softHyphen" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="dayShort" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="monthShort" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="yearShort" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="dayLong" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="monthLong" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="yearLong" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="annotationRef" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="footnoteRef" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="endnoteRef" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="separator" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="continuationSeparator" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="pgNum" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="cr" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="tab" type="CT_Empty" minOccurs="0" />
//   <xsd:element name="lastRenderedPageBreak" type="CT_Empty" minOccurs="0" maxOccurs="1" />
// </xsd:group>

/**
 * Represents a non-breaking hyphen character.
 *
 * Inserts a hyphen that prevents line breaking at that position.
 */
export class NoBreakHyphen extends EmptyElement {
    public constructor() {
        super("w:noBreakHyphen");
    }
}

/**
 * Represents a soft hyphen (optional hyphen) character.
 *
 * Inserts a hyphen that only appears when a word is broken across lines.
 */
export class SoftHyphen extends EmptyElement {
    public constructor() {
        super("w:softHyphen");
    }
}

/**
 * Represents the current day in short format (e.g., "1", "15").
 *
 * Inserts a dynamic field showing the day portion of the current date.
 */
export class DayShort extends EmptyElement {
    public constructor() {
        super("w:dayShort");
    }
}

/**
 * Represents the current month in short format (e.g., "1", "12").
 *
 * Inserts a dynamic field showing the month portion of the current date.
 */
export class MonthShort extends EmptyElement {
    public constructor() {
        super("w:monthShort");
    }
}

/**
 * Represents the current year in short format (e.g., "24").
 *
 * Inserts a dynamic field showing the year portion of the current date in two digits.
 */
export class YearShort extends EmptyElement {
    public constructor() {
        super("w:yearShort");
    }
}

/**
 * Represents the current day in long format (e.g., "01", "15").
 *
 * Inserts a dynamic field showing the day portion of the current date with leading zeros.
 */
export class DayLong extends EmptyElement {
    public constructor() {
        super("w:dayLong");
    }
}

/**
 * Represents the current month in long format (e.g., "January", "December").
 *
 * Inserts a dynamic field showing the full month name of the current date.
 */
export class MonthLong extends EmptyElement {
    public constructor() {
        super("w:monthLong");
    }
}

/**
 * Represents the current year in long format (e.g., "2024").
 *
 * Inserts a dynamic field showing the year portion of the current date in four digits.
 */
export class YearLong extends EmptyElement {
    public constructor() {
        super("w:yearLong");
    }
}

/**
 * Represents a reference to an annotation (comment).
 *
 * Used internally within comment ranges to mark comment references.
 */
export class AnnotationReference extends EmptyElement {
    public constructor() {
        super("w:annotationRef");
    }
}

/**
 * Represents a reference to a footnote.
 *
 * Used within footnote content to refer back to the footnote marker.
 */
export class FootnoteReferenceElement extends EmptyElement {
    public constructor() {
        super("w:footnoteRef");
    }
}

/**
 * Represents a reference to an endnote.
 *
 * Used within endnote content to refer back to the endnote marker.
 */
export class EndnoteReference extends EmptyElement {
    public constructor() {
        super("w:endnoteRef");
    }
}

/**
 * Represents a separator line for footnotes or endnotes.
 *
 * Used to create the separator line between document content and footnotes/endnotes.
 */
export class Separator extends EmptyElement {
    public constructor() {
        super("w:separator");
    }
}

/**
 * Represents a continuation separator for footnotes or endnotes.
 *
 * Used when footnotes/endnotes continue across multiple pages.
 */
export class ContinuationSeparator extends EmptyElement {
    public constructor() {
        super("w:continuationSeparator");
    }
}

/**
 * Represents a page number field element.
 *
 * Inserts the current page number at this position.
 */
export class PageNumberElement extends EmptyElement {
    public constructor() {
        super("w:pgNum");
    }
}

/**
 * Represents a carriage return character.
 *
 * Inserts a carriage return, which may be rendered differently than a standard line break.
 */
export class CarriageReturn extends EmptyElement {
    public constructor() {
        super("w:cr");
    }
}

/**
 * Represents a tab character.
 *
 * Inserts a tab stop, advancing to the next tab position in the paragraph.
 *
 * @publicApi
 */
export class Tab extends EmptyElement {
    public constructor() {
        super("w:tab");
    }
}

/**
 * Represents the last rendered page break location.
 *
 * Used internally by Word to track where page breaks occurred in the last rendering.
 * This is typically generated by Word and not created manually.
 */
export class LastRenderedPageBreak extends EmptyElement {
    public constructor() {
        super("w:lastRenderedPageBreak");
    }
}

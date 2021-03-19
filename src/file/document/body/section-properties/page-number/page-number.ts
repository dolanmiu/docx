// http://officeopenxml.com/WPSectionPgNumType.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum PageNumberFormat {
    CARDINAL_TEXT = "cardinalText",
    DECIMAL = "decimal",
    DECIMAL_ENCLOSED_CIRCLE = "decimalEnclosedCircle",
    DECIMAL_ENCLOSED_FULL_STOP = "decimalEnclosedFullstop",
    DECIMAL_ENCLOSED_PAREN = "decimalEnclosedParen",
    DECIMAL_ZERO = "decimalZero",
    LOWER_LETTER = "lowerLetter",
    LOWER_ROMAN = "lowerRoman",
    NONE = "none",
    ORDINAL_TEXT = "ordinalText",
    UPPER_LETTER = "upperLetter",
    UPPER_ROMAN = "upperRoman",
    DECIMAL_FULL_WIDTH = "decimalFullWidth",
}

export enum PageNumberSeparator {
    COLON = "colon",
    EM_DASH = "emDash",
    EN_DASH = "endash",
    HYPHEN = "hyphen",
    PERIOD = "period",
}

export interface IPageNumberTypeAttributes {
    readonly start?: number;
    readonly formatType?: PageNumberFormat;
    readonly separator?: PageNumberSeparator;
}

export class PageNumberTypeAttributes extends XmlAttributeComponent<IPageNumberTypeAttributes> {
    protected readonly xmlKeys = {
        start: "w:start",
        formatType: "w:fmt",
        separator: "w:chapSep",
    };
}

export class PageNumberType extends XmlComponent {
    constructor(start?: number, numberFormat?: PageNumberFormat, separator?: PageNumberSeparator) {
        super("w:pgNumType");
        this.root.push(
            new PageNumberTypeAttributes({
                start: start,
                formatType: numberFormat,
                separator: separator,
            }),
        );
    }
}

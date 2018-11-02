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
}

export interface IPageNumberTypeAttributes {
    readonly pageNumberStart?: number;
    readonly pageNumberFormatType?: PageNumberFormat;
}

export class PageNumberTypeAttributes extends XmlAttributeComponent<IPageNumberTypeAttributes> {
    protected readonly xmlKeys = {
        pageNumberStart: "w:start",
        pageNumberFormatType: "w:fmt",
    };
}

export class PageNumberType extends XmlComponent {
    constructor(start?: number, numberFormat?: PageNumberFormat) {
        super("w:pgNumType");
        this.root.push(
            new PageNumberTypeAttributes({
                pageNumberStart: start,
                pageNumberFormatType: numberFormat,
            }),
        );
    }
}

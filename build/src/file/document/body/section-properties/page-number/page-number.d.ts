import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
export declare enum PageNumberFormat {
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
    UPPER_ROMAN = "upperRoman"
}
export interface IPageNumberTypeAttributes {
    pageNumberStart?: number;
    pageNumberFormatType?: PageNumberFormat;
}
export declare class PageNumberTypeAttributes extends XmlAttributeComponent<IPageNumberTypeAttributes> {
    protected xmlKeys: {
        pageNumberStart: string;
        pageNumberFormatType: string;
    };
}
export declare class PageNumberType extends XmlComponent {
    constructor(start?: number, numberFormat?: PageNumberFormat);
}

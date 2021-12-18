// http://officeopenxml.com/WPnumbering-numFmt.php
import { decimalNumber } from "file/values";
import { Attributes, NumberValueElement, XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { AlignmentType } from "../paragraph/formatting";
import { ILevelParagraphStylePropertiesOptions, ParagraphProperties } from "../paragraph/properties";
import { IRunStylePropertiesOptions, RunProperties } from "../paragraph/run/properties";

export enum LevelFormat {
    BULLET = "bullet",
    CARDINAL_TEXT = "cardinalText",
    CHICAGO = "chicago",
    DECIMAL = "decimal",
    DECIMAL_ENCLOSED_CIRCLE = "decimalEnclosedCircle",
    DECIMAL_ENCLOSED_FULLSTOP = "decimalEnclosedFullstop",
    DECIMAL_ENCLOSED_PARENTHESES = "decimalEnclosedParen",
    DECIMAL_ZERO = "decimalZero",
    LOWER_LETTER = "lowerLetter",
    LOWER_ROMAN = "lowerRoman",
    NONE = "none",
    ORDINAL_TEXT = "ordinalText",
    UPPER_LETTER = "upperLetter",
    UPPER_ROMAN = "upperRoman",
}

class LevelAttributes extends XmlAttributeComponent<{
    readonly ilvl?: number;
    readonly tentative?: number;
}> {
    protected readonly xmlKeys = {
        ilvl: "w:ilvl",
        tentative: "w15:tentative",
    };
}

// <xsd:complexType name="CT_NumFmt">
//     <xsd:attribute name="val" type="ST_NumberFormat" use="required"/>
//     <xsd:attribute name="format" type="s:ST_String" use="optional"/>
// </xsd:complexType>
class NumberFormat extends XmlComponent {
    constructor(value: string) {
        super("w:numFmt");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

// <xsd:complexType name="CT_LevelText">
//     <xsd:attribute name="val" type="s:ST_String" use="optional"/>
//     <xsd:attribute name="null" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>
class LevelText extends XmlComponent {
    constructor(value: string) {
        super("w:lvlText");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

class LevelJc extends XmlComponent {
    constructor(value: AlignmentType) {
        super("w:lvlJc");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

export enum LevelSuffix {
    NOTHING = "nothing",
    SPACE = "space",
    TAB = "tab",
}

export interface ILevelsOptions {
    readonly level: number;
    readonly format?: LevelFormat;
    readonly text?: string;
    readonly alignment?: AlignmentType;
    readonly start?: number;
    readonly suffix?: LevelSuffix;
    readonly style?: {
        readonly run?: IRunStylePropertiesOptions;
        readonly paragraph?: ILevelParagraphStylePropertiesOptions;
    };
}

// <xsd:complexType name="CT_LevelSuffix">
//     <xsd:attribute name="val" type="ST_LevelSuffix" use="required"/>
// </xsd:complexType>
//     <xsd:simpleType name="ST_LevelSuffix">
//         <xsd:restriction base="xsd:string">
//             <xsd:enumeration value="tab"/>
//             <xsd:enumeration value="space"/>
//             <xsd:enumeration value="nothing"/>
//         </xsd:restriction>
//     </xsd:simpleType>
class Suffix extends XmlComponent {
    constructor(value: LevelSuffix) {
        super("w:suff");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

// <xsd:complexType name="CT_Lvl">
//     <xsd:sequence>
//         <xsd:element name="start" type="CT_DecimalNumber" minOccurs="0"/>
//         <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
//         <xsd:element name="lvlRestart" type="CT_DecimalNumber" minOccurs="0"/>
//         <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
//         <xsd:element name="isLgl" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="suff" type="CT_LevelSuffix" minOccurs="0"/>
//         <xsd:element name="lvlText" type="CT_LevelText" minOccurs="0"/>
//         <xsd:element name="lvlPicBulletId" type="CT_DecimalNumber" minOccurs="0"/>
//         <xsd:element name="legacy" type="CT_LvlLegacy" minOccurs="0"/>
//         <xsd:element name="lvlJc" type="CT_Jc" minOccurs="0"/>
//         <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
//         <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
//     <xsd:attribute name="tplc" type="ST_LongHexNumber" use="optional"/>
//     <xsd:attribute name="tentative" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>
export class LevelBase extends XmlComponent {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    constructor({ level, format, text, alignment = AlignmentType.START, start = 1, style, suffix }: ILevelsOptions) {
        super("w:lvl");

        this.root.push(new NumberValueElement("w:start", decimalNumber(start)));

        if (format) {
            this.root.push(new NumberFormat(format));
        }

        if (suffix) {
            this.root.push(new Suffix(suffix));
        }

        if (text) {
            this.root.push(new LevelText(text));
        }

        this.root.push(new LevelJc(alignment));

        this.paragraphProperties = new ParagraphProperties(style && style.paragraph);
        this.runProperties = new RunProperties(style && style.run);

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);

        if (level > 9) {
            throw new Error(
                "Level cannot be greater than 9. Read more here: https://answers.microsoft.com/en-us/msoffice/forum/all/does-word-support-more-than-9-list-levels/d130fdcd-1781-446d-8c84-c6c79124e4d7",
            );
        }

        this.root.push(
            new LevelAttributes({
                ilvl: decimalNumber(level),
                tentative: 1,
            }),
        );
    }
}

export class Level extends LevelBase {
    // This is the level that sits under abstractNum. We make a
    // handful of properties required
    constructor(options: ILevelsOptions) {
        super(options);
    }
}

export class LevelForOverride extends LevelBase {}

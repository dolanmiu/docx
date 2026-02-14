/**
 * Run properties module for WordprocessingML documents.
 *
 * This module provides the run properties (rPr) element which specifies
 * the formatting applied to a run of text.
 *
 * Reference: https://www.ecma-international.org/wp-content/uploads/ECMA-376-1_5th_edition_december_2016.zip
 * Section 17.3.2.21 (page 297)
 *
 * @module
 */
import { BorderElement, IBorderOptions } from "@file/border";
import { IShadingAttributesProperties, Shading } from "@file/shading";
import { ChangeAttributes, IChangedAttributesProperties } from "@file/track-revision/track-revision";
import {
    HpsMeasureElement,
    IgnoreIfEmptyXmlComponent,
    NumberValueElement,
    OnOffElement,
    StringValueElement,
    XmlComponent,
} from "@file/xml-components";
import { PositiveUniversalMeasure, UniversalMeasure } from "@util/values";

import { EmphasisMark, EmphasisMarkType } from "./emphasis-mark";
import { CharacterSpacing, Color, Highlight, HighlightComplexScript } from "./formatting";
import { ILanguageOptions, createLanguageComponent } from "./language";
import { IFontAttributesProperties, RunFonts } from "./run-fonts";
import { SubScript, SuperScript } from "./script";
import { Underline, UnderlineType } from "./underline";

type IFontOptions = {
    readonly name: string;
    readonly hint?: string;
};

/**
 * Text animation effect types.
 *
 * These effects specify animations that can be applied to text. Note that
 * these effects are deprecated and may not be supported by all applications.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TextEffect">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="blinkBackground"/>
 *     <xsd:enumeration value="lights"/>
 *     <xsd:enumeration value="antsBlack"/>
 *     <xsd:enumeration value="antsRed"/>
 *     <xsd:enumeration value="shimmer"/>
 *     <xsd:enumeration value="sparkle"/>
 *     <xsd:enumeration value="none"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const TextEffect = {
    /** Blinking background animation */
    BLINK_BACKGROUND: "blinkBackground",
    /** Lights animation effect */
    LIGHTS: "lights",
    /** Black marching ants animation */
    ANTS_BLACK: "antsBlack",
    /** Red marching ants animation */
    ANTS_RED: "antsRed",
    /** Shimmer animation effect */
    SHIMMER: "shimmer",
    /** Sparkle animation effect */
    SPARKLE: "sparkle",
    /** No text effect */
    NONE: "none",
} as const;

/**
 * Highlight color values for text highlighting.
 *
 * These colors specify the background highlight color that can be applied to text.
 *
 * Reference: http://officeopenxml.com/WPtextShading.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HighlightColor">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="black"/>
 *     <xsd:enumeration value="blue"/>
 *     <xsd:enumeration value="cyan"/>
 *     <xsd:enumeration value="green"/>
 *     <xsd:enumeration value="magenta"/>
 *     <xsd:enumeration value="red"/>
 *     <xsd:enumeration value="yellow"/>
 *     <xsd:enumeration value="white"/>
 *     <xsd:enumeration value="darkBlue"/>
 *     <xsd:enumeration value="darkCyan"/>
 *     <xsd:enumeration value="darkGreen"/>
 *     <xsd:enumeration value="darkMagenta"/>
 *     <xsd:enumeration value="darkRed"/>
 *     <xsd:enumeration value="darkYellow"/>
 *     <xsd:enumeration value="darkGray"/>
 *     <xsd:enumeration value="lightGray"/>
 *     <xsd:enumeration value="none"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const HighlightColor = {
    /** Black highlight */
    BLACK: "black",
    /** Blue highlight */
    BLUE: "blue",
    /** Cyan highlight */
    CYAN: "cyan",
    /** Dark blue highlight */
    DARK_BLUE: "darkBlue",
    /** Dark cyan highlight */
    DARK_CYAN: "darkCyan",
    /** Dark gray highlight */
    DARK_GRAY: "darkGray",
    /** Dark green highlight */
    DARK_GREEN: "darkGreen",
    /** Dark magenta highlight */
    DARK_MAGENTA: "darkMagenta",
    /** Dark red highlight */
    DARK_RED: "darkRed",
    /** Dark yellow highlight */
    DARK_YELLOW: "darkYellow",
    /** Green highlight */
    GREEN: "green",
    /** Light gray highlight */
    LIGHT_GRAY: "lightGray",
    /** Magenta highlight */
    MAGENTA: "magenta",
    /** No highlight */
    NONE: "none",
    /** Red highlight */
    RED: "red",
    /** White highlight */
    WHITE: "white",
    /** Yellow highlight */
    YELLOW: "yellow",
} as const;

/**
 * Run style properties options.
 *
 * These properties define the formatting that can be applied to a run of text,
 * including font, size, bold, italic, underline, color, and other character formatting.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 */
export type IRunStylePropertiesOptions = {
    readonly noProof?: boolean;
    readonly bold?: boolean;
    readonly boldComplexScript?: boolean;
    readonly italics?: boolean;
    readonly italicsComplexScript?: boolean;
    readonly underline?: {
        readonly color?: string;
        readonly type?: (typeof UnderlineType)[keyof typeof UnderlineType];
    };
    readonly effect?: (typeof TextEffect)[keyof typeof TextEffect];
    readonly emphasisMark?: {
        readonly type?: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType];
    };
    readonly color?: string;
    readonly kern?: number | PositiveUniversalMeasure;
    readonly position?: UniversalMeasure;
    readonly size?: number | PositiveUniversalMeasure;
    readonly sizeComplexScript?: boolean | number | PositiveUniversalMeasure;
    readonly rightToLeft?: boolean;
    readonly smallCaps?: boolean;
    readonly allCaps?: boolean;
    readonly strike?: boolean;
    readonly doubleStrike?: boolean;
    readonly subScript?: boolean;
    readonly superScript?: boolean;
    readonly font?: string | IFontOptions | IFontAttributesProperties;
    readonly highlight?: (typeof HighlightColor)[keyof typeof HighlightColor];
    readonly highlightComplexScript?: boolean | string;
    readonly characterSpacing?: number;
    readonly shading?: IShadingAttributesProperties;
    readonly emboss?: boolean;
    readonly imprint?: boolean;
    readonly revision?: IRunPropertiesChangeOptions;
    readonly language?: ILanguageOptions;
    readonly border?: IBorderOptions;
    readonly snapToGrid?: boolean;
    readonly vanish?: boolean;
    readonly specVanish?: boolean;
    readonly scale?: number;
    readonly math?: boolean;
};

/**
 * Options for configuring run properties.
 *
 * Extends IRunStylePropertiesOptions with a style reference.
 */
export type IRunPropertiesOptions = {
    /** Reference to a character style by name */
    readonly style?: string;
} & IRunStylePropertiesOptions;

/**
 * Options for run properties change tracking.
 *
 * Used for revision tracking when run properties have been modified.
 */
export type IRunPropertiesChangeOptions = {} & IRunPropertiesOptions & IChangedAttributesProperties;

// <xsd:group name="EG_RPrBase">
//     <xsd:choice>
//     <xsd:element name="rStyle" type="CT_String"/>
//     <xsd:element name="rFonts" type="CT_Fonts"/>
//     <xsd:element name="b" type="CT_OnOff"/>
//     <xsd:element name="bCs" type="CT_OnOff"/>
//     <xsd:element name="i" type="CT_OnOff"/>
//     <xsd:element name="iCs" type="CT_OnOff"/>
//     <xsd:element name="caps" type="CT_OnOff"/>
//     <xsd:element name="smallCaps" type="CT_OnOff"/>
//     <xsd:element name="strike" type="CT_OnOff"/>
//     <xsd:element name="dstrike" type="CT_OnOff"/>
//     <xsd:element name="outline" type="CT_OnOff"/>
//     <xsd:element name="shadow" type="CT_OnOff"/>
//     <xsd:element name="emboss" type="CT_OnOff"/>
//     <xsd:element name="imprint" type="CT_OnOff"/>
//     <xsd:element name="noProof" type="CT_OnOff"/>
//     <xsd:element name="snapToGrid" type="CT_OnOff"/>
//     <xsd:element name="vanish" type="CT_OnOff"/>
//     <xsd:element name="webHidden" type="CT_OnOff"/>
//     <xsd:element name="color" type="CT_Color"/>
//     <xsd:element name="spacing" type="CT_SignedTwipsMeasure"/>
//     <xsd:element name="w" type="CT_TextScale"/>
//     <xsd:element name="kern" type="CT_HpsMeasure"/>
//     <xsd:element name="position" type="CT_SignedHpsMeasure"/>
//     <xsd:element name="sz" type="CT_HpsMeasure"/>
//     <xsd:element name="szCs" type="CT_HpsMeasure"/>
//     <xsd:element name="highlight" type="CT_Highlight"/>
//     <xsd:element name="u" type="CT_Underline"/>
//     <xsd:element name="effect" type="CT_TextEffect"/>
//     <xsd:element name="bdr" type="CT_Border"/>
//     <xsd:element name="shd" type="CT_Shd"/>
//     <xsd:element name="fitText" type="CT_FitText"/>
//     <xsd:element name="vertAlign" type="CT_VerticalAlignRun"/>
//     <xsd:element name="rtl" type="CT_OnOff"/>
//     <xsd:element name="cs" type="CT_OnOff"/>
//     <xsd:element name="em" type="CT_Em"/>
//     <xsd:element name="lang" type="CT_Language"/>
//     <xsd:element name="eastAsianLayout" type="CT_EastAsianLayout"/>
//     <xsd:element name="specVanish" type="CT_OnOff"/>
//     <xsd:element name="oMath" type="CT_OnOff"/>
//     </xsd:choice>
// </xsd:group>

/**
 * Represents run properties (rPr) in a WordprocessingML document.
 *
 * Run properties specify all character-level formatting applied to text,
 * such as bold, italic, font, size, color, underline, and other text effects.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RPr">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RPrContent" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * The EG_RPrBase group includes elements like rStyle, rFonts, b, bCs, i, iCs,
 * caps, smallCaps, strike, dstrike, outline, shadow, emboss, imprint, noProof,
 * snapToGrid, vanish, color, spacing, w, kern, position, sz, szCs, highlight,
 * u, effect, bdr, shd, vertAlign, rtl, em, lang, and more.
 */
export class RunProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options?: IRunPropertiesOptions) {
        super("w:rPr");

        if (!options) {
            return;
        }

        if (options.style) {
            this.push(new StringValueElement("w:rStyle", options.style));
        }

        if (options.font) {
            if (typeof options.font === "string") {
                this.push(new RunFonts(options.font));
            } else if ("name" in options.font) {
                this.push(new RunFonts(options.font.name, options.font.hint));
            } else {
                this.push(new RunFonts(options.font));
            }
        }

        if (options.bold !== undefined) {
            this.push(new OnOffElement("w:b", options.bold));
        }

        if ((options.boldComplexScript === undefined && options.bold !== undefined) || options.boldComplexScript) {
            this.push(new OnOffElement("w:bCs", options.boldComplexScript ?? options.bold));
        }

        if (options.italics !== undefined) {
            this.push(new OnOffElement("w:i", options.italics));
        }

        if ((options.italicsComplexScript === undefined && options.italics !== undefined) || options.italicsComplexScript) {
            this.push(new OnOffElement("w:iCs", options.italicsComplexScript ?? options.italics));
        }

        // These two are mutually exclusive
        if (options.smallCaps !== undefined) {
            this.push(new OnOffElement("w:smallCaps", options.smallCaps));
        } else if (options.allCaps !== undefined) {
            this.push(new OnOffElement("w:caps", options.allCaps));
        }

        if (options.strike !== undefined) {
            this.push(new OnOffElement("w:strike", options.strike));
        }

        if (options.doubleStrike !== undefined) {
            this.push(new OnOffElement("w:dstrike", options.doubleStrike));
        }

        if (options.emboss !== undefined) {
            this.push(new OnOffElement("w:emboss", options.emboss));
        }

        if (options.imprint !== undefined) {
            this.push(new OnOffElement("w:imprint", options.imprint));
        }

        if (options.noProof !== undefined) {
            this.push(new OnOffElement("w:noProof", options.noProof));
        }

        if (options.snapToGrid !== undefined) {
            this.push(new OnOffElement("w:snapToGrid", options.snapToGrid));
        }

        if (options.vanish) {
            // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_vanish_topic_ID0E6W3O.html
            // http://www.datypic.com/sc/ooxml/e-w_vanish-1.html
            this.push(new OnOffElement("w:vanish", options.vanish));
        }

        if (options.color) {
            this.push(new Color(options.color));
        }

        if (options.characterSpacing) {
            this.push(new CharacterSpacing(options.characterSpacing));
        }

        if (options.scale !== undefined) {
            this.push(new NumberValueElement("w:w", options.scale));
        }

        if (options.kern) {
            this.push(new HpsMeasureElement("w:kern", options.kern));
        }

        if (options.position) {
            this.push(new StringValueElement("w:position", options.position));
        }

        if (options.size !== undefined) {
            this.push(new HpsMeasureElement("w:sz", options.size));
        }
        const szCs =
            options.sizeComplexScript === undefined || options.sizeComplexScript === true ? options.size : options.sizeComplexScript;
        if (szCs) {
            this.push(new HpsMeasureElement("w:szCs", szCs));
        }

        if (options.highlight) {
            this.push(new Highlight(options.highlight));
        }
        const highlightCs =
            options.highlightComplexScript === undefined || options.highlightComplexScript === true
                ? options.highlight
                : options.highlightComplexScript;
        if (highlightCs) {
            this.push(new HighlightComplexScript(highlightCs));
        }

        if (options.underline) {
            this.push(new Underline(options.underline.type, options.underline.color));
        }

        if (options.effect) {
            this.push(new StringValueElement("w:effect", options.effect));
        }

        if (options.border) {
            this.push(new BorderElement("w:bdr", options.border));
        }

        if (options.shading) {
            this.push(new Shading(options.shading));
        }

        if (options.subScript) {
            this.push(new SubScript());
        }

        if (options.superScript) {
            this.push(new SuperScript());
        }

        if (options.rightToLeft !== undefined) {
            this.push(new OnOffElement("w:rtl", options.rightToLeft));
        }

        if (options.emphasisMark) {
            this.push(new EmphasisMark(options.emphasisMark.type));
        }

        if (options.language) {
            this.push(createLanguageComponent(options.language));
        }

        if (options.specVanish) {
            // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_specVanish_topic_ID0EIE1O.html
            this.push(new OnOffElement("w:specVanish", options.vanish));
        }

        if (options.math) {
            this.push(new OnOffElement("w:oMath", options.math));
        }

        if (options.revision) {
            this.push(new RunPropertiesChange(options.revision));
        }
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }
}

/**
 * Represents a run properties change element for revision tracking.
 *
 * This element is used to track changes to run properties when revision
 * tracking is enabled in the document.
 */
export class RunPropertiesChange extends XmlComponent {
    public constructor(options: IRunPropertiesChangeOptions) {
        super("w:rPrChange");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.addChildElement(new RunProperties(options as IRunPropertiesOptions));
    }
}

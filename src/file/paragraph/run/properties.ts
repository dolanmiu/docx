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

import { EmphasisMark, EmphasisMarkType } from "./emphasis-mark";
import { CharacterSpacing, Color, Highlight, HighlightComplexScript } from "./formatting";
import { IFontAttributesProperties, RunFonts } from "./run-fonts";
import { SubScript, SuperScript } from "./script";
import { Underline, UnderlineType } from "./underline";

interface IFontOptions {
    readonly name: string;
    readonly hint?: string;
}

export interface IRunStylePropertiesOptions {
    readonly bold?: boolean;
    readonly boldComplexScript?: boolean;
    readonly italics?: boolean;
    readonly italicsComplexScript?: boolean;
    readonly underline?: {
        readonly color?: string;
        readonly type?: UnderlineType;
    };
    readonly emphasisMark?: {
        readonly type?: EmphasisMarkType;
    };
    readonly color?: string;
    readonly size?: number | string;
    readonly sizeComplexScript?: boolean | number | string;
    readonly rightToLeft?: boolean;
    readonly smallCaps?: boolean;
    readonly allCaps?: boolean;
    readonly strike?: boolean;
    readonly doubleStrike?: boolean;
    readonly subScript?: boolean;
    readonly superScript?: boolean;
    readonly font?: string | IFontOptions | IFontAttributesProperties;
    readonly highlight?: string;
    readonly highlightComplexScript?: boolean | string;
    readonly characterSpacing?: number;
    readonly shading?: IShadingAttributesProperties;
    readonly emboss?: boolean;
    readonly imprint?: boolean;
    readonly revision?: IRunPropertiesChangeOptions;
    readonly border?: IBorderOptions;
    readonly vanish?: boolean;
    readonly specVanish?: boolean;
    readonly scale?: number;
}

export interface IRunPropertiesOptions extends IRunStylePropertiesOptions {
    readonly style?: string;
}

export interface IRunPropertiesChangeOptions extends IRunPropertiesOptions, IChangedAttributesProperties {}

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
export class RunProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options?: IRunPropertiesOptions) {
        super("w:rPr");

        if (!options) {
            return;
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

        if (options.underline) {
            this.push(new Underline(options.underline.type, options.underline.color));
        }

        if (options.emphasisMark) {
            this.push(new EmphasisMark(options.emphasisMark.type));
        }

        if (options.color) {
            this.push(new Color(options.color));
        }

        if (options.size !== undefined) {
            this.push(new HpsMeasureElement("w:sz", options.size));
        }
        const szCs =
            options.sizeComplexScript === undefined || options.sizeComplexScript === true ? options.size : options.sizeComplexScript;
        if (szCs) {
            this.push(new HpsMeasureElement("w:szCs", szCs));
        }

        if (options.rightToLeft !== undefined) {
            this.push(new OnOffElement("w:rtl", options.rightToLeft));
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

        if (options.subScript) {
            this.push(new SubScript());
        }

        if (options.superScript) {
            this.push(new SuperScript());
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

        if (options.characterSpacing) {
            this.push(new CharacterSpacing(options.characterSpacing));
        }

        if (options.emboss !== undefined) {
            this.push(new OnOffElement("w:emboss", options.emboss));
        }

        if (options.imprint !== undefined) {
            this.push(new OnOffElement("w:imprint", options.imprint));
        }

        if (options.shading) {
            this.push(new Shading(options.shading));
        }

        if (options.revision) {
            this.push(new RunPropertiesChange(options.revision));
        }

        if (options.border) {
            this.push(new BorderElement("w:bdr", options.border));
        }

        if (options.vanish) {
            // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_vanish_topic_ID0E6W3O.html
            // http://www.datypic.com/sc/ooxml/e-w_vanish-1.html
            this.push(new OnOffElement("w:vanish", options.vanish));
        }

        if (options.specVanish) {
            // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_specVanish_topic_ID0EIE1O.html
            this.push(new OnOffElement("w:specVanish", options.vanish));
        }

        if (options.scale !== undefined) {
            this.push(new NumberValueElement("w:w", options.scale));
        }
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }
}

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

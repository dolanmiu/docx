import { ShadingType } from "file/table";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "file/xml-components";
import { EmphasisMark, EmphasisMarkType } from "./emphasis-mark";
import {
    Bold,
    BoldComplexScript,
    Caps,
    CharacterSpacing,
    Color,
    DoubleStrike,
    Emboss,
    Highlight,
    HighlightComplexScript,
    Imprint,
    Italics,
    ItalicsComplexScript,
    RightToLeft,
    Shading,
    ShadowComplexScript,
    Size,
    SizeComplexScript,
    SmallCaps,
    Strike,
} from "./formatting";
import { IFontAttributesProperties, RunFonts } from "./run-fonts";
import { SubScript, SuperScript } from "./script";
import { Style } from "./style";
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
    readonly size?: number;
    readonly sizeComplexScript?: boolean | number;
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
    readonly shading?: {
        readonly type: ShadingType;
        readonly fill: string;
        readonly color: string;
    };
    readonly shadingComplexScript?: boolean | IRunStylePropertiesOptions["shading"];
    readonly shadow?: IRunStylePropertiesOptions["shading"];
    readonly emboss?: boolean;
    readonly imprint?: boolean;
}

export interface IRunPropertiesOptions extends IRunStylePropertiesOptions {
    readonly style?: string;
}

export class RunProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options?: IRunPropertiesOptions) {
        super("w:rPr");

        if (!options) {
            return;
        }

        if (options.bold) {
            this.push(new Bold());
        }
        if ((options.boldComplexScript === undefined && options.bold) || options.boldComplexScript) {
            this.push(new BoldComplexScript());
        }

        if (options.italics) {
            this.push(new Italics());
        }
        if ((options.italicsComplexScript === undefined && options.italics) || options.italicsComplexScript) {
            this.push(new ItalicsComplexScript());
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

        if (options.size) {
            this.push(new Size(options.size));
        }
        const szCs =
            options.sizeComplexScript === undefined || options.sizeComplexScript === true ? options.size : options.sizeComplexScript;
        if (szCs) {
            this.push(new SizeComplexScript(szCs));
        }

        if (options.rightToLeft) {
            this.push(new RightToLeft());
        }

        if (options.smallCaps) {
            this.push(new SmallCaps());
        }

        if (options.allCaps) {
            this.push(new Caps());
        }

        if (options.strike) {
            this.push(new Strike());
        }

        if (options.doubleStrike) {
            this.push(new DoubleStrike());
        }

        if (options.subScript) {
            this.push(new SubScript());
        }

        if (options.superScript) {
            this.push(new SuperScript());
        }

        if (options.style) {
            this.push(new Style(options.style));
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

        if (options.emboss) {
            this.push(new Emboss());
        }

        if (options.imprint) {
            this.push(new Imprint());
        }

        const shading = options.shading || options.shadow;
        if (shading) {
            this.push(new Shading(shading.type, shading.fill, shading.color));
        }
        const shdCs =
            options.shadingComplexScript === undefined || options.shadingComplexScript === true ? shading : options.shadingComplexScript;
        if (shdCs) {
            this.push(new ShadowComplexScript(shdCs.type, shdCs.fill, shdCs.color));
        }
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }
}

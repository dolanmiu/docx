// http://officeopenxml.com/WPtext.php
import { ShadingType } from "file/table";
import { XmlComponent } from "file/xml-components";

import { FieldInstruction } from "file/table-of-contents/field-instruction";
import { Break } from "./break";
import { Caps, SmallCaps } from "./caps";
import { Begin, End, Separate } from "./field";
import {
    Bold,
    BoldComplexScript,
    Color,
    DoubleStrike,
    Highlight,
    HighlightComplexScript,
    Italics,
    ItalicsComplexScript,
    RightToLeft,
    Shading,
    ShadowComplexScript,
    Size,
    SizeComplexScript,
    Strike,
} from "./formatting";
import { NumberOfPages, NumberOfPagesSection, Page } from "./page-number";
import { RunProperties } from "./properties";
import { RunFonts } from "./run-fonts";
import { SubScript, SuperScript } from "./script";
import { Style } from "./style";
import { Tab } from "./tab";
import { Underline, UnderlineType } from "./underline";

export interface IRunOptions {
    readonly bold?: true;
    readonly italics?: true;
    readonly underline?: {
        readonly color?: string;
        readonly type?: UnderlineType;
    };
    readonly color?: string;
    readonly size?: number;
    readonly rightToLeft?: boolean;
    readonly smallCaps?: boolean;
    readonly allCaps?: boolean;
    readonly strike?: boolean;
    readonly doubleStrike?: boolean;
    readonly subScript?: boolean;
    readonly superScript?: boolean;
    readonly style?: string;
    readonly font?: {
        readonly name: string;
        readonly hint?: string;
    };
    readonly highlight?: string;
    readonly shading?: {
        readonly type: ShadingType;
        readonly fill: string;
        readonly color: string;
    };
    readonly children?: Array<Begin | FieldInstruction | Separate | End>;
}

export class Run extends XmlComponent {
    protected readonly properties: RunProperties;

    constructor(options: IRunOptions) {
        super("w:r");
        this.properties = new RunProperties();
        this.root.push(this.properties);

        if (options.bold) {
            this.properties.push(new Bold());
            this.properties.push(new BoldComplexScript());
        }

        if (options.italics) {
            this.properties.push(new Italics());
            this.properties.push(new ItalicsComplexScript());
        }

        if (options.underline) {
            this.properties.push(new Underline(options.underline.type, options.underline.color));
        }

        if (options.color) {
            this.properties.push(new Color(options.color));
        }

        if (options.size) {
            this.properties.push(new Size(options.size));
            this.properties.push(new SizeComplexScript(options.size));
        }

        if (options.rightToLeft) {
            this.properties.push(new RightToLeft());
        }

        if (options.smallCaps) {
            this.properties.push(new SmallCaps());
        }

        if (options.allCaps) {
            this.properties.push(new Caps());
        }

        if (options.strike) {
            this.properties.push(new Strike());
        }

        if (options.doubleStrike) {
            this.properties.push(new DoubleStrike());
        }

        if (options.subScript) {
            this.properties.push(new SubScript());
        }

        if (options.superScript) {
            this.properties.push(new SuperScript());
        }

        if (options.style) {
            this.properties.push(new Style(options.style));
        }

        if (options.font) {
            this.properties.push(new RunFonts(options.font.name, options.font.hint));
        }

        if (options.highlight) {
            this.properties.push(new Highlight(options.highlight));
            this.properties.push(new HighlightComplexScript(options.highlight));
        }

        if (options.shading) {
            this.properties.push(new Shading(options.shading.type, options.shading.fill, options.shading.color));
            this.properties.push(new ShadowComplexScript(options.shading.type, options.shading.fill, options.shading.color));
        }

        if (options.children) {
            for (const child of options.children) {
                this.root.push(child);
            }
        }
    }

    public break(): Run {
        this.root.splice(1, 0, new Break());
        return this;
    }

    public tab(): Run {
        this.root.splice(1, 0, new Tab());
        return this;
    }

    public pageNumber(): Run {
        this.root.push(new Begin());
        this.root.push(new Page());
        this.root.push(new Separate());
        this.root.push(new End());
        return this;
    }

    public numberOfTotalPages(): Run {
        this.root.push(new Begin());
        this.root.push(new NumberOfPages());
        this.root.push(new Separate());
        this.root.push(new End());
        return this;
    }

    public numberOfTotalPagesSection(): Run {
        this.root.push(new Begin());
        this.root.push(new NumberOfPagesSection());
        this.root.push(new Separate());
        this.root.push(new End());
        return this;
    }
}

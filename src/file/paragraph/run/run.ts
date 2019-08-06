// http://officeopenxml.com/WPtext.php
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
    Shadow,
    ShadowComplexScript,
    Size,
    SizeComplexScript,
    Strike,
} from "./formatting";
import { NumberOfPages, Page } from "./page-number";
import { RunProperties } from "./properties";
import { RunFonts } from "./run-fonts";
import { SubScript, SuperScript } from "./script";
import { Style } from "./style";
import { Tab } from "./tab";
import { Underline, UnderlineType } from "./underline";

import { XmlComponent } from "file/xml-components";

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

    public smallCaps(): Run {
        this.properties.push(new SmallCaps());
        return this;
    }

    public allCaps(): Run {
        this.properties.push(new Caps());
        return this;
    }

    public strike(): Run {
        this.properties.push(new Strike());
        return this;
    }

    public doubleStrike(): Run {
        this.properties.push(new DoubleStrike());
        return this;
    }

    public subScript(): Run {
        this.properties.push(new SubScript());
        return this;
    }

    public superScript(): Run {
        this.properties.push(new SuperScript());
        return this;
    }

    public font(fontName: string, hint?: string | undefined): Run {
        this.properties.push(new RunFonts(fontName, hint));
        return this;
    }

    public style(styleId: string): Run {
        this.properties.push(new Style(styleId));
        return this;
    }

    public highlight(color: string): Run {
        this.properties.push(new Highlight(color));
        this.properties.push(new HighlightComplexScript(color));
        return this;
    }

    public shadow(value: string, fill: string, color: string): Run {
        this.properties.push(new Shadow(value, fill, color));
        this.properties.push(new ShadowComplexScript(value, fill, color));
        return this;
    }
}

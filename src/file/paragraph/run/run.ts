// http://officeopenxml.com/WPtext.php
import { Break } from "./break";
import { Caps, SmallCaps } from "./caps";
import { Begin, End, Separate } from "./field";
import {
    Bold,
    BoldComplexScript,
    Color,
    DoubleStrike,
    Italics,
    ItalicsComplexScript,
    RightToLeft,
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
import { Underline } from "./underline";

import { XmlComponent } from "file/xml-components";

export class Run extends XmlComponent {
    protected readonly properties: RunProperties;

    constructor() {
        super("w:r");
        this.properties = new RunProperties();
        this.root.push(this.properties);
    }

    public bold(): Run {
        this.properties.push(new Bold());
        this.properties.push(new BoldComplexScript());
        return this;
    }

    public italic(): Run {
        this.properties.push(new Italics());
        this.properties.push(new ItalicsComplexScript());
        return this;
    }

    public underline(underlineType?: string, color?: string): Run {
        this.properties.push(new Underline(underlineType, color));
        return this;
    }

    public color(color: string): Run {
        this.properties.push(new Color(color));
        return this;
    }

    public size(size: number): Run {
        this.properties.push(new Size(size));
        this.properties.push(new SizeComplexScript(size));
        return this;
    }

    public rightToLeft(): Run {
        this.properties.push(new RightToLeft());
        return this;
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
}

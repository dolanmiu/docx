import * as paragraph from "../docx/paragraph/formatting";
import { ParagraphProperties } from "../docx/paragraph/properties";
import { RunProperties } from "../docx/run/properties";
import { Attributes, XmlAttributeComponent, XmlComponent } from "../docx/xml-components";

interface ILevelAttributesProperties {
    ilvl?: number;
    tentative?: number;
}

class LevelAttributes extends XmlAttributeComponent<ILevelAttributesProperties> {
    protected xmlKeys = {
        ilvl: "w:ilvl",
        tentative: "w15:tentative",
    };
}

class Start extends XmlComponent {

    constructor(value: number) {
        super("w:start");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class NumberFormat extends XmlComponent {

    constructor(value: string) {
        super("w:numFmt");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class LevelText extends XmlComponent {

    constructor(value: string) {
        super("w:lvlText");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class LevelJc extends XmlComponent {

    constructor(value: string) {
        super("w:lvlJc");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

export class Level extends XmlComponent {
    private paragraphProperties: ParagraphProperties;
    private runProperties: RunProperties;

    constructor(level: number, numberFormat: string, levelText: string, lvlJc: string) {
        super("w:lvl");
        this.root.push(new LevelAttributes({
            ilvl: level,
            tentative: 1,
        }));

        this.root.push(new Start(1));
        this.root.push(new NumberFormat(numberFormat));
        this.root.push(new LevelText(levelText));
        this.root.push(new LevelJc(lvlJc));

        this.paragraphProperties = new ParagraphProperties();
        this.runProperties = new RunProperties();

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }

    public addParagraphProperty(property: XmlComponent): Level {
        this.paragraphProperties.push(property);
        return this;
    }

    public addRunProperty(property: XmlComponent): Level {
        this.runProperties.push(property);
        return this;
    }

    // --------------------- Paragraph formatting ------------------------ //

    public center(): Level {
        this.addParagraphProperty(new paragraph.Alignment("center"));
        return this;
    }

    public left(): Level {
        this.addParagraphProperty(new paragraph.Alignment("left"));
        return this;
    }

    public right(): Level {
        this.addParagraphProperty(new paragraph.Alignment("right"));
        return this;
    }

    public justified(): Level {
        this.addParagraphProperty(new paragraph.Alignment("both"));
        return this;
    }

    public thematicBreak(): Level {
        this.addParagraphProperty(new paragraph.ThematicBreak());
        return this;
    }

    public maxRightTabStop(): Level {
        this.addParagraphProperty(new paragraph.MaxRightTabStop());
        return this;
    }

    public leftTabStop(position: number): Level {
        this.addParagraphProperty(new paragraph.LeftTabStop(position));
        return this;
    }

    public indent(left: number, hanging?: number): Level {
        this.addParagraphProperty(new paragraph.Indent(left, hanging));
        return this;
    }

    public spacing(params: paragraph.ISpacingProperties): Level {
        this.addParagraphProperty(new paragraph.Spacing(params));
        return this;
    };
}

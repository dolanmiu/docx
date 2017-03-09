import { ParagraphProperties } from "../docx/paragraph/properties";
import { RunProperties } from "../docx/run/properties";
import { Attributes, XmlAttributeComponent, XmlComponent } from "../docx/xml-components";

interface ILevelAttributesProperties {
    ilvl?: number;
    tentative?: number;
}

class LevelAttributes extends XmlAttributeComponent {

    constructor(properties: ILevelAttributesProperties) {
        super({
            ilvl: "w:ilvl",
            tentative: "w15:tentative",
        }, properties);
    }
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

    public clearVariables(): void {
        this.paragraphProperties.clearVariables();
        this.runProperties.clearVariables();

        delete this.paragraphProperties;
        delete this.runProperties;
    }

    public addParagraphProperty(property: XmlComponent): Level {
        this.paragraphProperties.push(property);
        return this;
    }

    public addRunProperty(property: XmlComponent): Level {
        this.runProperties.push(property);
        return this;
    }
}

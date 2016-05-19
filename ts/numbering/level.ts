import {XmlComponent, Attributes, MultiPropertyXmlComponent} from "../docx/xml-components";
import {XmlAttributeComponent} from "../docx/xml-components";
import {RunProperties} from "../docx/run/properties";
import {ParagraphProperties} from "../docx/paragraph/properties";

interface LevelAttributesProperties {
    ilvl?: number,
    tentative?: number
}

class LevelAttributes extends XmlAttributeComponent {

    constructor(properties: LevelAttributesProperties) {
        super({
            ilvl: "w:ilvl",
            tentative: "w15:tentative"
        }, properties);
    }

    properties
}

class Start extends XmlComponent {

    constructor(value: number) {
        super("w:start");
        this.root.push(new Attributes({
            val: value
        }));
    }
}

class NumberFormat extends XmlComponent {

    constructor(value: string) {
        super("w:numFmt");
        this.root.push(new Attributes({
            val: value
        }));
    }
}

class LevelText extends XmlComponent {

    constructor(value: string) {
        super("w:lvlText");
        this.root.push(new Attributes({
            val: value
        }));
    }
}

class LevelJc extends XmlComponent {

    constructor(value: string) {
        super("w:lvlJc");
        this.root.push(new Attributes({
            val: value
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
            tentative: 1
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

    clearVariables(): void {
        this.paragraphProperties.clearVariables();
        this.runProperties.clearVariables();

        delete this.paragraphProperties;
        delete this.runProperties;
    }
    
        addParagraphProperty(property: XmlComponent): void {
        this.paragraphProperties.push(property);
    }

    addRunProperty(property: XmlComponent): void {
        this.runProperties.push(property);
    }
}
import { ParagraphProperties } from "../paragraph/properties";
import { RunProperties } from "../run/properties";
import { XmlComponent } from "./";

export class ParagraphPropertyXmlComponent extends XmlComponent {
    private paragraphProperties: ParagraphProperties;

    constructor(rootKey: string) {
        super(rootKey);
        this.paragraphProperties = new ParagraphProperties();
        this.root.push(this.paragraphProperties);
    }

    public clearVariables(): void {
        this.paragraphProperties.clearVariables();

        delete this.paragraphProperties;
    }
}

export class RunPropertyXmlComponent extends XmlComponent {
    private runProperties: RunProperties;

    constructor(rootKey: string) {
        super(rootKey);
        this.runProperties = new RunProperties();
        this.root.push(this.runProperties);
    }

    public clearVariables(): void {
        this.runProperties.clearVariables();

        delete this.runProperties;
    }
}

export class MultiPropertyXmlComponent extends XmlComponent {
    private runProperties: RunProperties;
    private paragraphProperties: ParagraphProperties;

    constructor(rootKey: string) {
        super(rootKey);
        this.runProperties = new RunProperties();
        this.root.push(this.runProperties);

        this.paragraphProperties = new ParagraphProperties();
        this.root.push(this.paragraphProperties);
    }

    public clearVariables(): void {
        this.runProperties.clearVariables();
        this.paragraphProperties.clearVariables();

        delete this.runProperties;
        delete this.paragraphProperties;
    }
}

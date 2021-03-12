import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";

class AbstractNumId extends XmlComponent {
    constructor(value: number) {
        super("w:abstractNumId");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

class NumAttributes extends XmlAttributeComponent<{
    readonly numId: number;
}> {
    protected readonly xmlKeys = { numId: "w:numId" };
}

export interface IConcreteNumberingOptions {
    readonly numId: number;
    readonly abstractNumId: number;
    readonly reference: string;
    readonly instance: number;
    readonly overrideLevel?: {
        readonly num: number;
        readonly start?: number;
    };
}

export class ConcreteNumbering extends XmlComponent {
    public readonly numId: number;
    public readonly reference: string;
    public readonly instance: number;

    constructor(options: IConcreteNumberingOptions) {
        super("w:num");

        this.numId = options.numId;
        this.reference = options.reference;
        this.instance = options.instance;

        this.root.push(
            new NumAttributes({
                numId: options.numId,
            }),
        );

        this.root.push(new AbstractNumId(options.abstractNumId));

        if (options.overrideLevel) {
            this.root.push(new LevelOverride(options.overrideLevel.num, options.overrideLevel.start));
        }
    }
}

class LevelOverrideAttributes extends XmlAttributeComponent<{ readonly ilvl: number }> {
    protected readonly xmlKeys = { ilvl: "w:ilvl" };
}

export class LevelOverride extends XmlComponent {
    constructor(levelNum: number, start?: number) {
        super("w:lvlOverride");
        this.root.push(new LevelOverrideAttributes({ ilvl: levelNum }));
        if (start !== undefined) {
            this.root.push(new StartOverride(start));
        }
    }
}

class StartOverrideAttributes extends XmlAttributeComponent<{ readonly val: number }> {
    protected readonly xmlKeys = { val: "w:val" };
}

class StartOverride extends XmlComponent {
    constructor(start: number) {
        super("w:startOverride");
        this.root.push(new StartOverrideAttributes({ val: start }));
    }
}

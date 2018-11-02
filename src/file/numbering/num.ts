import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { LevelForOverride } from "./level";

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

interface INumAttributesProperties {
    readonly numId: number;
}

class NumAttributes extends XmlAttributeComponent<INumAttributesProperties> {
    protected readonly xmlKeys = { numId: "w:numId" };
}

export class Num extends XmlComponent {
    public readonly id: number;

    constructor(numId: number, abstractNumId: number) {
        super("w:num");
        this.root.push(
            new NumAttributes({
                numId: numId,
            }),
        );
        this.root.push(new AbstractNumId(abstractNumId));
        this.id = numId;
    }

    public overrideLevel(num: number, start?: number): LevelOverride {
        const olvl = new LevelOverride(num, start);
        this.root.push(olvl);
        return olvl;
    }
}

class LevelOverrideAttributes extends XmlAttributeComponent<{ readonly ilvl: number }> {
    protected readonly xmlKeys = { ilvl: "w:ilvl" };
}

export class LevelOverride extends XmlComponent {
    private readonly lvl: LevelForOverride;

    constructor(private readonly levelNum: number, start?: number) {
        super("w:lvlOverride");
        this.root.push(new LevelOverrideAttributes({ ilvl: levelNum }));
        if (start !== undefined) {
            this.root.push(new StartOverride(start));
        }

        this.lvl = new LevelForOverride(this.levelNum);
        this.root.push(this.lvl);
    }

    public get Level(): LevelForOverride {
        return this.lvl;
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

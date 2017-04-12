import { Attributes, XmlAttributeComponent, XmlComponent } from "../docx/xml-components";
import { LevelForOverride } from "./level";

class AbstractNumId extends XmlComponent {

    constructor(value: number) {
        super("w:abstractNumId");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

interface INumAttributesProperties {
    numId: number;
}

class NumAttributes extends XmlAttributeComponent<INumAttributesProperties> {
    protected xmlKeys = {numId: "w:numId"};
}

export class Num extends XmlComponent {
    public id: number;

    constructor(numId: number, abstractNumId: number) {
        super("w:num");
        this.root.push(new NumAttributes({
            numId: numId,
        }));
        this.root.push(new AbstractNumId(abstractNumId));
        this.id = numId;
    }

    public overrideLevel(num: number, start?: number): LevelOverride {
        const olvl = new LevelOverride(num, start);
        this.root.push(olvl);
        return olvl;
    }
}

class LevelOverrideAttributes extends XmlAttributeComponent<{ilvl: number}> {
    protected xmlKeys = {ilvl: "w:ilvl"};
}

class LevelOverride extends XmlComponent {
    private levelNum: number;
    private lvl?: LevelForOverride;

    constructor(levelNum: number, start?: number) {
        super("w:lvlOverride");
        this.root.push(new LevelOverrideAttributes({ilvl: levelNum}));
        if (start !== undefined) {
            this.root.push(new StartOverride(start));
        }
        this.levelNum = levelNum;
    }

    get level(): LevelForOverride {
        let lvl: LevelForOverride;
        if (!this.lvl) {
            lvl = new LevelForOverride(this.levelNum);
            this.root.push(lvl);
            this.lvl = lvl;
        } else {
            lvl = this.lvl;
        }
        return lvl;
    }
}

class StartOverrideAttributes extends XmlAttributeComponent<{val: number}> {
    protected xmlKeys = {val: "w:val"};
}

class StartOverride extends XmlComponent {
    constructor(start: number) {
        super("w:startOverride");
        this.root.push(new StartOverrideAttributes({val: start}));
    }
}

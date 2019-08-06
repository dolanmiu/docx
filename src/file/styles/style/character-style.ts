import * as formatting from "file/paragraph/run/formatting";
import { RunProperties } from "file/paragraph/run/properties";
import { XmlComponent } from "file/xml-components";
import { BasedOn, Link, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";
import { Style } from "./style";

export class CharacterStyle extends Style {
    private readonly runProperties: RunProperties;

    constructor(styleId: string, name?: string) {
        super({ type: "character", styleId: styleId }, name);
        this.runProperties = new RunProperties();
        this.root.push(this.runProperties);
        this.root.push(new UiPriority("99"));
        this.root.push(new UnhideWhenUsed());
    }

    public basedOn(parentId: string): CharacterStyle {
        this.root.push(new BasedOn(parentId));
        return this;
    }

    public addRunProperty(property: XmlComponent): CharacterStyle {
        this.runProperties.push(property);
        return this;
    }

    public color(color: string): CharacterStyle {
        return this.addRunProperty(new formatting.Color(color));
    }

    public bold(): CharacterStyle {
        return this.addRunProperty(new formatting.Bold());
    }

    public italics(): CharacterStyle {
        return this.addRunProperty(new formatting.Italics());
    }

    public underline(underlineType?: string, color?: string): CharacterStyle {
        return this.addRunProperty(new formatting.Underline(underlineType, color));
    }

    public superScript(): CharacterStyle {
        return this.addRunProperty(new formatting.SuperScript());
    }

    public size(twips: number): CharacterStyle {
        return this.addRunProperty(new formatting.Size(twips)).addRunProperty(new formatting.SizeComplexScript(twips));
    }

    public link(link: string): CharacterStyle {
        this.root.push(new Link(link));
        return this;
    }

    public semiHidden(): CharacterStyle {
        this.root.push(new SemiHidden());
        return this;
    }

    public highlight(color: string): CharacterStyle {
        return this.addRunProperty(new formatting.Highlight(color));
    }

    public shadow(value: string, fill: string, color: string): CharacterStyle {
        return this.addRunProperty(new formatting.Shading(value, fill, color));
    }
}

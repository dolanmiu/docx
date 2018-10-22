// http://officeopenxml.com/WPspacing.php
import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface ISpacingProperties {
    after?: number;
    before?: number;
    line?: number;
    lineRule?: string;
}

class SpacingAttributes extends XmlAttributeComponent<ISpacingProperties> {
    protected xmlKeys = {
        after: "w:after",
        before: "w:before",
        line: "w:line",
        lineRule: "w:lineRule",
    };
}

export class Spacing extends XmlComponent {
    constructor(opts: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(opts));
    }
}

export class ContextualSpacing extends XmlComponent {
    constructor(value: boolean) {
        super("w:contextualSpacing");
        this.root.push(
            new Attributes({
                val: value === false ? 0 : 1,
            }),
        );
    }
}

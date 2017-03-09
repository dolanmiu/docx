import { XmlAttributeComponent, XmlComponent } from "../xml-components";

export interface ISpacingProperties {
    after?: number;
    before?: number;
    line?: number;
}

class SpacingAttributes extends XmlAttributeComponent {
    constructor(properties: ISpacingProperties) {
        super({
            after: "w:after",
            before: "w:before",
            line: "w:line",
        }, properties);
    }
}

export class Spacing extends XmlComponent {
    constructor(opts: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(opts));
    }
}

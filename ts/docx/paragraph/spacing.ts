import { XmlAttributeComponent, XmlComponent } from "../xml-components";

export interface ISpacingProperties {
    after?: number;
    before?: number;
    line?: number;
}

class SpacingAttributes extends XmlAttributeComponent<ISpacingProperties> {
    protected xmlKeys = {
        after: "w:after",
        before: "w:before",
        line: "w:line",
    };
}

export class Spacing extends XmlComponent {
    constructor(opts: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(opts));
    }
}

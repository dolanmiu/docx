import { XmlAttributeComponent, XmlComponent } from "../xml-components";

export type AlignmentOptions = "left" | "center" | "right" | "both";

export class AlignmentAttributes extends XmlAttributeComponent<{val: AlignmentOptions}> {
    protected xmlKeys = {val: "w:val"};
}

export class Alignment extends XmlComponent {

    constructor(type: AlignmentOptions) {
        super("w:jc");
        this.root.push(new AlignmentAttributes({val: type}));
    }
}

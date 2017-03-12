import { XmlAttributeComponent, XmlComponent } from "../xml-components";

type alignmentOptions = "left" | "center" | "right" | "both";

class AlignmentAttributes extends XmlAttributeComponent<{val: alignmentOptions}> {
    protected xmlKeys = {val: "w:val"};
}

export class Alignment extends XmlComponent {

    constructor(type: alignmentOptions) {
        super("w:jc");
        this.root.push(new AlignmentAttributes({val: type}));
    }
}

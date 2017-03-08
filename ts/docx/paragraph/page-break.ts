import { Run } from "../run";
import { Attributes, XmlComponent } from "../xml-components";

class Break extends XmlComponent {

    constructor() {
        super("w:br");
        this.root.push(new Attributes({
            type: "page",
        }));
    }
}

export class PageBreak extends Run {

    constructor() {
        super();
        this.root.push(new Break());
    }
}

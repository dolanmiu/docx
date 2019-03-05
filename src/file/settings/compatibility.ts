import { XmlComponent } from "file/xml-components";

class DoNotExpandShiftReturn extends XmlComponent {
    constructor() {
        super("w:doNotExpandShiftReturn");
    }
}

export class Compatibility extends XmlComponent {
    constructor() {
        super("w:compat");
    }

    public doNotExpandShiftReturn(): Compatibility {
        this.root.push(new DoNotExpandShiftReturn());

        return this;
    }
}

import { XmlComponent } from "../xml-components";

export class Strike extends XmlComponent {

    constructor() {
        super("w:strike");
    }
}

export class DoubleStrike extends XmlComponent {

    constructor() {
        super("w:dstrike");
    }
}

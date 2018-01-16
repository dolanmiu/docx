import { XmlComponent } from "file/xml-components";
import { ExtentAttributes } from "./extent-attributes";

export class Extent extends XmlComponent {

    constructor() {
        super("wp:extent");

        this.root.push(new ExtentAttributes({
            cx: 3162300,
            cy: 2857500,
        }));
    }
}

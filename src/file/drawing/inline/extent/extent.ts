import { XmlComponent } from "file/xml-components";
import { ExtentAttributes } from "./extent-attributes";

export class Extent extends XmlComponent {
    constructor(x: number, y: number) {
        super("wp:extent");

        this.root.push(
            new ExtentAttributes({
                cx: x,
                cy: y,
            }),
        );
    }
}

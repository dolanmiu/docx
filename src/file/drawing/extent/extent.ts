import { XmlComponent } from "@file/xml-components";

import { ExtentAttributes } from "./extent-attributes";

export class Extent extends XmlComponent {
    private readonly attributes: ExtentAttributes;

    public constructor(x: number, y: number) {
        super("wp:extent");

        this.attributes = new ExtentAttributes({
            cx: x,
            cy: y,
        });

        this.root.push(this.attributes);
    }
}

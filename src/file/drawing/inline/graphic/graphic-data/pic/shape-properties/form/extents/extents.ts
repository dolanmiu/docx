// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "@file/xml-components";
import { ExtentsAttributes } from "./extents-attributes";

export class Extents extends XmlComponent {
    private readonly attributes: ExtentsAttributes;

    public constructor(x: number, y: number) {
        super("a:ext");

        this.attributes = new ExtentsAttributes({
            cx: x,
            cy: y,
        });

        this.root.push(this.attributes);
    }
}

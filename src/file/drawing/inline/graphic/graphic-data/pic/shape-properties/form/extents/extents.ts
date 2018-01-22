// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "file/xml-components";
import { ExtentsAttributes } from "./extents-attributes";

export class Extents extends XmlComponent {

    constructor(x: number, y: number) {
        super("a:ext");

        this.root.push(new ExtentsAttributes({
            cx: x,
            cy: y,
        }));
    }
}

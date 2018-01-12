// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "file/xml-components";
import { ExtentsAttributes } from "./extents-attributes";

export class Extents extends XmlComponent {

    constructor() {
        super("a:ext");

        this.root.push(new ExtentsAttributes({
            cx: 3162300,
            cy: 2857500,
        }));
    }
}

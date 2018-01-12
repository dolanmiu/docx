// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "file/xml-components";
import { Extents } from "./extents/extents";
import { Offset } from "./offset/off";

export class Form extends XmlComponent {

    constructor() {
        super("a:xfrm");

        this.root.push(new Extents());
        this.root.push(new Offset());
    }
}

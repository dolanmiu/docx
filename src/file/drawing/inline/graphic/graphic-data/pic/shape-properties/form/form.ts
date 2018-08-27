// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "file/xml-components";
import { Extents } from "./extents/extents";
import { Offset } from "./offset/off";

export class Form extends XmlComponent {
    private readonly extents: Extents;

    constructor(x: number, y: number) {
        super("a:xfrm");

        this.extents = new Extents(x, y);

        this.root.push(this.extents);
        this.root.push(new Offset());
    }

    public setXY(x: number, y: number): void {
        this.extents.setXY(x, y);
    }
}

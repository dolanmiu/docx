// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "file/xml-components";
import { ExtentsAttributes } from "./extents-attributes";

export class Extents extends XmlComponent {
    private readonly attributes: ExtentsAttributes;

    constructor(x: number, y: number) {
        super("a:ext");

        this.attributes = new ExtentsAttributes({
            cx: x,
            cy: y,
        });

        this.root.push(this.attributes);
    }

    public setXY(x: number, y: number): void {
        this.attributes.set({
            cx: x,
            cy: y,
        });
    }
}

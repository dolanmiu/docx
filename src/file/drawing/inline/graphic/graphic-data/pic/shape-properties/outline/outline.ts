// http://officeopenxml.com/drwSp-outline.php
import { XmlComponent } from "@file/xml-components";
import { NoFill } from "./no-fill";

export class Outline extends XmlComponent {
    public constructor() {
        super("a:ln");

        this.root.push(new NoFill());
    }
}

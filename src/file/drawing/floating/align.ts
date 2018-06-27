// http://officeopenxml.com/drwPicFloating-position.php
import { XmlComponent } from "file/xml-components";
import { HorizontalPositionAlign, VerticalPositionAlign } from "./floating-position";

export class Align extends XmlComponent {
    constructor(value: HorizontalPositionAlign | VerticalPositionAlign) {
        super("wp:align");
        this.root.push(value);
    }
}

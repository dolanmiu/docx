// http://officeopenxml.com/drwPicFloating-position.php
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";
import { XmlComponent } from "@file/xml-components";

export class Align extends XmlComponent {
    public constructor(value: HorizontalPositionAlign | VerticalPositionAlign) {
        super("wp:align");
        this.root.push(value);
    }
}

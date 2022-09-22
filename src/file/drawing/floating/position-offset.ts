// http://officeopenxml.com/drwPicFloating-position.php
import { XmlComponent } from "@file/xml-components";

export class PositionOffset extends XmlComponent {
    public constructor(offsetValue: number) {
        super("wp:posOffset");
        this.root.push(offsetValue.toString());
    }
}

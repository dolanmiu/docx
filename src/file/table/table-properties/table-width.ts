// http://officeopenxml.com/WPtableWidth.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { WidthType } from "../table-cell";

class TableWidthAttributes extends XmlAttributeComponent<{
    readonly type: WidthType;
    readonly w: number | string;
}> {
    protected readonly xmlKeys = { type: "w:type", w: "w:w" };
}

export class PreferredTableWidth extends XmlComponent {
    constructor(type: WidthType = WidthType.AUTO, w: number) {
        super("w:tblW");
        const width: number | string = type === WidthType.PERCENTAGE ? `${w}%` : w;
        this.root.push(new TableWidthAttributes({ type: type, w: width }));
    }
}

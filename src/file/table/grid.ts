// http://officeopenxml.com/WPtableGrid.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TableGrid extends XmlComponent {
    constructor(widths: number[]) {
        super("w:tblGrid");
        for (const width of widths) {
            this.root.push(new GridCol(width));
        }
    }
}

class GridColAttributes extends XmlAttributeComponent<{ readonly w: number }> {
    protected readonly xmlKeys = { w: "w:w" };
}

export class GridCol extends XmlComponent {
    constructor(width?: number) {
        super("w:gridCol");
        if (width !== undefined) {
            this.root.push(new GridColAttributes({ w: width }));
        }
    }
}

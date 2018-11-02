// http://officeopenxml.com/WPtableGrid.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TableGrid extends XmlComponent {
    constructor(cols: number[]) {
        super("w:tblGrid");
        cols.forEach((col) => this.root.push(new GridCol(col)));
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

import { XmlAttributeComponent, XmlComponent } from "../xml-components";

export class TableGrid extends XmlComponent {
    constructor(cols: number[]) {
        super("w:tblGrid");
        cols.forEach((col) => this.root.push(new GridCol(col)));
    }
}

class GridColAttributes extends XmlAttributeComponent<{w: number}> {
    protected xmlKeys = {w: "w:w"};
}

export class GridCol extends XmlComponent {
    constructor(width?: number) {
        super("w:gridCol");
        if (width !== undefined) {
            this.root.push(new GridColAttributes({w: width}));
        }
    }
}

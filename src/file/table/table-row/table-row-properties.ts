// http://officeopenxml.com/WPtableRowProperties.php
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { HeightRule, TableRowHeight } from "./table-row-height";

export class TableRowProperties extends IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:trPr");
    }

    public setCantSplit(): TableRowProperties {
        this.root.push(new CantSplit());

        return this;
    }

    public setTableHeader(): TableRowProperties {
        this.root.push(new TableHeader());

        return this;
    }

    public setHeight(value: number, rule: HeightRule): TableRowProperties {
        this.root.push(new TableRowHeight(value, rule));

        return this;
    }
}

class CantSplitAttributes extends XmlAttributeComponent<{ readonly val: boolean }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class CantSplit extends XmlComponent {
    constructor() {
        super("w:cantSplit");
        this.root.push(new CantSplitAttributes({ val: true }));
    }
}

class TableHeaderAttributes extends XmlAttributeComponent<{ readonly val: boolean }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class TableHeader extends XmlComponent {
    constructor() {
        super("w:tblHeader");
        this.root.push(new TableHeaderAttributes({ val: true }));
    }
}

import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TableRowProperties extends XmlComponent {
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

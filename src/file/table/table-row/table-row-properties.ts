// http://officeopenxml.com/WPtableRowProperties.php
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { HeightRule, TableRowHeight } from "./table-row-height";

export interface ITableRowPropertiesOptions {
    readonly cantSplit?: boolean;
    readonly tableHeader?: boolean;
    readonly height?: {
        readonly value: number;
        readonly rule: HeightRule;
    };
}

export class TableRowProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableRowPropertiesOptions) {
        super("w:trPr");

        if (options.cantSplit) {
            this.root.push(new CantSplit());
        }

        if (options.tableHeader) {
            this.root.push(new TableHeader());
        }

        if (options.height) {
            this.root.push(new TableRowHeight(options.height.value, options.height.rule));
        }
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

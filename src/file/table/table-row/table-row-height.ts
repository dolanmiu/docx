import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum HeightRule {
    /** Height is determined based on the content, so value is ignored. */
    AUTO = "auto",
    /** At least the value specified */
    ATLEAST = "atLeast",
    /** Exactly the value specified */
    EXACT = "exact",
}

export class TableRowHeightAttributes extends XmlAttributeComponent<{
    readonly value: number;
    readonly rule: HeightRule;
}> {
    protected readonly xmlKeys = { value: "w:val", rule: "w:hRule" };
}

export class TableRowHeight extends XmlComponent {
    constructor(value: number, rule: HeightRule) {
        super("w:trHeight");

        this.root.push(
            new TableRowHeightAttributes({
                value: value,
                rule: rule,
            }),
        );
    }
}

// http://officeopenxml.com/WPspacing.php
import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum LineRuleType {
    AT_LEAST = "atLeast",
    EXACTLY = "exactly",
    AUTO = "auto",
}
export interface ISpacingProperties {
    readonly after?: number;
    readonly before?: number;
    readonly line?: number;
    readonly lineRule?: LineRuleType;
    readonly beforeAutoSpacing?: boolean;
    readonly afterAutoSpacing?: boolean;
}

class SpacingAttributes extends XmlAttributeComponent<ISpacingProperties> {
    protected readonly xmlKeys = {
        after: "w:after",
        before: "w:before",
        line: "w:line",
        lineRule: "w:lineRule",
    };
}

export class Spacing extends XmlComponent {
    constructor(options: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(options));
    }
}

export class ContextualSpacing extends XmlComponent {
    constructor(value: boolean) {
        super("w:contextualSpacing");
        this.root.push(
            new Attributes({
                val: value === false ? 0 : 1,
            }),
        );
    }
}

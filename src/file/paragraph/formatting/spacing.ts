// http://officeopenxml.com/WPspacing.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export enum LineRuleType {
    AT_LEAST = "atLeast",
    EXACTLY = "exactly",
    EXACT = "exact",
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
    public constructor(options: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(options));
    }
}

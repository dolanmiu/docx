// http://officeopenxml.com/WPspacing.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export const LineRuleType = {
    AT_LEAST: "atLeast",
    EXACTLY: "exactly",
    EXACT: "exact",
    AUTO: "auto",
} as const;

export type ISpacingProperties = {
    readonly after?: number;
    readonly before?: number;
    readonly line?: number;
    readonly lineRule?: (typeof LineRuleType)[keyof typeof LineRuleType];
    readonly beforeAutoSpacing?: boolean;
    readonly afterAutoSpacing?: boolean;
};

class SpacingAttributes extends XmlAttributeComponent<ISpacingProperties> {
    protected readonly xmlKeys = {
        after: "w:after",
        before: "w:before",
        line: "w:line",
        lineRule: "w:lineRule",
        beforeAutoSpacing: "w:beforeAutospacing",
        afterAutoSpacing: "w:afterAutospacing",
    };
}

export class Spacing extends XmlComponent {
    public constructor(options: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(options));
    }
}

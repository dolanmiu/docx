// http://officeopenxml.com/WPspacing.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

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

export const createSpacing = ({ after, before, line, lineRule, beforeAutoSpacing, afterAutoSpacing }: ISpacingProperties): XmlComponent =>
    new BuilderElement<ISpacingProperties>({
        name: "w:spacing",
        attributes: {
            after: { key: "w:after", value: after },
            before: { key: "w:before", value: before },
            line: { key: "w:line", value: line },
            lineRule: { key: "w:lineRule", value: lineRule },
            beforeAutoSpacing: { key: "w:beforeAutospacing", value: beforeAutoSpacing },
            afterAutoSpacing: { key: "w:afterAutospacing", value: afterAutoSpacing },
        },
    });

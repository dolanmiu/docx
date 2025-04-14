// http://www.datypic.com/sc/ooxml/e-m_naryPr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createMathAccentCharacter } from "./math-accent-character";
import { createMathLimitLocation } from "./math-limit-location";
import { createMathSubScriptHide } from "./math-sub-script-hide";
import { createMathSuperScriptHide } from "./math-super-script-hide";

type MathNAryPropertiesOptions = {
    readonly accent: string;
    readonly hasSuperScript: boolean;
    readonly hasSubScript: boolean;
    readonly limitLocationVal?: string;
};

export const createMathNAryProperties = ({
    accent,
    hasSuperScript,
    hasSubScript,
    limitLocationVal,
}: MathNAryPropertiesOptions): XmlComponent =>
    new BuilderElement({
        name: "m:naryPr",
        children: [
            ...(!!accent ? [createMathAccentCharacter({ accent })] : []),
            createMathLimitLocation({ value: limitLocationVal }),
            ...(!hasSuperScript ? [createMathSuperScriptHide()] : []),
            ...(!hasSubScript ? [createMathSubScriptHide()] : []),
        ],
    });

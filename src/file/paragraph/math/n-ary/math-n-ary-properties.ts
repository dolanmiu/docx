// http://www.datypic.com/sc/ooxml/e-m_naryPr-1.html
import { XmlComponent } from "@file/xml-components";

import { MathAccentCharacter } from "./math-accent-character";
import { MathLimitLocation } from "./math-limit-location";
import { MathSubScriptHide } from "./math-sub-script-hide";
import { MathSuperScriptHide } from "./math-super-script-hide";

export class MathNAryProperties extends XmlComponent {
    public constructor(accent: string, hasSuperScript: boolean, hasSubScript: boolean) {
        super("m:naryPr");

        if (!!accent) {
            this.root.push(new MathAccentCharacter(accent));
        }
        this.root.push(new MathLimitLocation());

        if (!hasSuperScript) {
            this.root.push(new MathSuperScriptHide());
        }

        if (!hasSubScript) {
            this.root.push(new MathSubScriptHide());
        }
    }
}

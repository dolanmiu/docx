// http://www.datypic.com/sc/ooxml/e-m_naryPr-1.html
import { XmlComponent } from "file/xml-components";

import { MathAccentCharacter } from "./math-accent-character";
import { MathLimitLocation } from "./math-limit-location";

export class MathNArayProperties extends XmlComponent {
    constructor(readonly accent: string) {
        super("m:naryPr");

        this.root.push(new MathAccentCharacter(accent));
        this.root.push(new MathLimitLocation());
    }
}

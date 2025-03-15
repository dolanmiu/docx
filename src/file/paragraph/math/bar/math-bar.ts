// https://www.datypic.com/sc/ooxml/e-m_bar-1.html
import { XmlComponent } from "@file/xml-components";

import { MathBarProperties } from "./math-bar-properties";
import type { MathComponent } from "../math-component";
import { MathBase } from "../n-ary";

type MathBarOption = {
    readonly type: "top" | "bot";
    readonly children: readonly MathComponent[];
};
export class MathBar extends XmlComponent {
    public constructor(options: MathBarOption) {
        super("m:bar");
        this.root.push(new MathBarProperties(options.type));
        this.root.push(new MathBase(options.children));
    }
}

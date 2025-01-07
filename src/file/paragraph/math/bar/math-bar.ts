// https://www.datypic.com/sc/ooxml/e-m_bar-1.html
import { XmlComponent } from "@file/xml-components";
import { MathBarProperties } from "./math-bar-properties";
import { MathBase } from "../n-ary";
import type { MathComponent } from "../math-component";
type MathBarOption = {
    type: 'top' | 'bot' ,
    children: MathComponent[]
}
export class MathBar extends XmlComponent {
    constructor(options: MathBarOption) {
        super("m:bar");
        this.root.push(new MathBarProperties(options.type));
        this.root.push(new MathBase(options.children));
    }
}
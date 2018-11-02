// http://officeopenxml.com/WPindentation.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface IIndentAttributesProperties {
    readonly left?: number;
    readonly hanging?: number;
    readonly firstLine?: number;
    readonly start?: number;
    readonly end?: number;
}

class IndentAttributes extends XmlAttributeComponent<IIndentAttributesProperties> {
    protected readonly xmlKeys = {
        left: "w:left",
        hanging: "w:hanging",
        firstLine: "w:firstLine",
        start: "w:start",
        end: "w:end",
    };
}

export class Indent extends XmlComponent {
    constructor(attrs: IIndentAttributesProperties) {
        super("w:ind");
        this.root.push(new IndentAttributes(attrs));
    }
}

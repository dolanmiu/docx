// http://officeopenxml.com/WPparagraphProperties.php
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "file/xml-components";

import { Border, IBorderOptions } from "./formatting/border";

interface IParagraphPropertiesOptions {
    readonly border?: IBorderOptions;
}

export class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: IParagraphPropertiesOptions) {
        super("w:pPr");

        if (options.border) {
            this.push(new Border(options.border));
        }
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }
}

import { Paragraph } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

import { TextBoxContent } from "./text-box-content";

export class WpsTextBox extends XmlComponent {
    public constructor(children: readonly Paragraph[]) {
        super("wps:txbx");
        this.root.push(new TextBoxContent(children));
    }
}

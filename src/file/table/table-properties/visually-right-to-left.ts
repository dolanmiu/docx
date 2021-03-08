// https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_bidiVisual_topic_ID0EOXIQ.html
import { XmlComponent } from "file/xml-components";

export class VisuallyRightToLeft extends XmlComponent {
    constructor() {
        super("w:bidiVisual");
    }
}

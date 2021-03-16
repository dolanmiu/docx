// http://officeopenxml.com/WPSectionFooterReference.php
// https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_evenAndOddHeaders_topic_ID0ET1WU.html
import { XmlComponent } from "file/xml-components";

export class EvenAndOddHeadersAndFooters extends XmlComponent {
    constructor() {
        super("w:evenAndOddHeaders");
    }
}

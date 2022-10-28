// https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_tab_topic_ID0EM6AO.html
import { XmlComponent } from "@file/xml-components";

// <xsd:group name="EG_RunInnerContent">
//     ...
//     <xsd:element name="tab" type="CT_Empty" minOccurs="0"/>
//
// TODO: this is unused and undocumented currently.
// I think the intended use was for users to import, and insert as a child of `Run`.
export class Tab extends XmlComponent {
    public constructor() {
        super("w:tab");
    }
}

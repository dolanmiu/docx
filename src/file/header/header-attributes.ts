import { XmlAttributeComponent } from "file/xml-components";

export interface IHeaderAttributesProperties {
    o?: string;
    r?: string;
    v?: string;
    w?: string;
    w10?: string;
    wp?: string;
    wps?: string;
    wpg?: string;
    mc?: string;
    wp14?: string;
    w14?: string;
}

export class HeaderAttributes extends XmlAttributeComponent<IHeaderAttributesProperties> {
    protected xmlKeys = {
        o: "xmlns:o",
        r: "xmlns:r",
        v: "xmlns:v",
        w: "xmlns:w",
        w10: "xmlns:w10",
        wp: "xmlns:wp",
        wps: "xmlns:wps",
        wpg: "xmlns:wpg",
        mc: "xmlns:mc",
        wp14: "xmlns:wp14",
        w14: "xmlns:w14",
    };
}

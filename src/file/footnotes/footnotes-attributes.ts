import { XmlAttributeComponent } from "file/xml-components";

export interface IFootnotesAttributesProperties {
    wpc?: string;
    mc?: string;
    o?: string;
    r?: string;
    m?: string;
    v?: string;
    wp14?: string;
    wp?: string;
    w10?: string;
    w?: string;
    w14?: string;
    w15?: string;
    wpg?: string;
    wpi?: string;
    wne?: string;
    wps?: string;
    Ignorable?: string;
}

export class FootnotesAttributes extends XmlAttributeComponent<IFootnotesAttributesProperties> {
    protected xmlKeys = {
        wpc: "xmlns:wpc",
        mc: "xmlns:mc",
        o: "xmlns:o",
        r: "xmlns:r",
        m: "xmlns:m",
        v: "xmlns:v",
        wp14: "xmlns:wp14",
        wp: "xmlns:wp",
        w10: "xmlns:w10",
        w: "xmlns:w",
        w14: "xmlns:w14",
        w15: "xmlns:w15",
        wpg: "xmlns:wpg",
        wpi: "xmlns:wpi",
        wne: "xmlns:wne",
        wps: "xmlns:wps",
        Ignorable: "mc:Ignorable",
    };
}

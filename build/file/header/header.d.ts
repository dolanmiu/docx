import { InitializableXmlComponent, XmlComponent } from "../../file/xml-components";
import { Paragraph } from "../paragraph";
import { Table } from "../table";
export declare class Header extends InitializableXmlComponent {
    private readonly refId;
    constructor(referenceNumber: number, initContent?: XmlComponent);
    get ReferenceId(): number;
    add(item: Paragraph | Table): void;
}

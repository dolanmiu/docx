import { XmlComponent } from "../../file/xml-components";
export declare type WidthTypes = "dxa" | "pct" | "nil" | "auto";
export declare class TableProperties extends XmlComponent {
    constructor();
    setWidth(type: WidthTypes, w: number | string): TableProperties;
    fixedWidthLayout(): TableProperties;
    setBorder(): TableProperties;
}

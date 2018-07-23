import { XmlAttributeComponent } from "file/xml-components";
export interface IPicLocksAttributes {
    noChangeAspect?: number;
    noChangeArrowheads?: number;
}
export declare class PicLocksAttributes extends XmlAttributeComponent<IPicLocksAttributes> {
    protected xmlKeys: {
        noChangeAspect: string;
        noChangeArrowheads: string;
    };
}

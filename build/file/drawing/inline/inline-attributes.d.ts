import { XmlAttributeComponent } from "../../../file/xml-components";
import { IDistance } from "../drawing";
export declare class InlineAttributes extends XmlAttributeComponent<IDistance> {
    protected readonly xmlKeys: {
        distT: string;
        distB: string;
        distL: string;
        distR: string;
    };
}

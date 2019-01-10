import { XmlAttributeComponent } from "file/xml-components";
import { IDistance } from "../drawing";

// distT, distB etc have no effect on inline images, only floating
export interface IInlineAttributes extends IDistance {
    readonly distT?: number;
    readonly distB?: number;
    readonly distL?: number;
    readonly distR?: number;
}

export class InlineAttributes extends XmlAttributeComponent<IInlineAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
    };
}

import { XmlAttributeComponent } from "file/xml-components";
import { IDistance } from "../drawing";

// tslint:disable-next-line:no-empty-interface
export interface IInlineAttributes extends IDistance {}

export class InlineAttributes extends XmlAttributeComponent<IInlineAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
    };
}

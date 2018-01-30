import { XmlAttributeComponent } from "file/xml-components";

export interface IInlineAttributes {
    distT?: number;
    distB?: number;
    distL?: number;
    distR?: number;
}

export class InlineAttributes extends XmlAttributeComponent<IInlineAttributes> {
    protected xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
    };
}

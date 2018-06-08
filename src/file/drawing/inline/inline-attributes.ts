import { XmlAttributeComponent } from "file/xml-components";
import { Distance } from "../drawing";

export interface IInlineAttributes extends Distance {}

export class InlineAttributes extends XmlAttributeComponent<IInlineAttributes> {
    protected xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
    };
}

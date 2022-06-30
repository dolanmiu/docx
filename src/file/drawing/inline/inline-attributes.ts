import { XmlAttributeComponent } from "@file/xml-components";
import { IDistance } from "../drawing";

// distT, distB etc have no effect on inline images, only floating
export class InlineAttributes extends XmlAttributeComponent<IDistance> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
    };
}

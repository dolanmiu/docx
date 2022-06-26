import { XmlAttributeComponent } from "@file/xml-components";

export class RelationshipsAttributes extends XmlAttributeComponent<{
    readonly xmlns: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
    };
}

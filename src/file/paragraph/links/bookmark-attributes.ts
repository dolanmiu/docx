import { XmlAttributeComponent } from "@file/xml-components";

export class BookmarkStartAttributes extends XmlAttributeComponent<{
    readonly id: number;
    readonly name: string;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
        name: "w:name",
    };
}

export class BookmarkEndAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

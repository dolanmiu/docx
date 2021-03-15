import { XmlAttributeComponent } from "file/xml-components";

export class BookmarkStartAttributes extends XmlAttributeComponent<{
    readonly id: string;
    readonly name: string;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
        name: "w:name",
    };
}

export class BookmarkEndAttributes extends XmlAttributeComponent<{
    readonly id: string;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

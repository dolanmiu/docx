import { XmlAttributeComponent } from "file/xml-components";

export interface IBookmarkStartAttributesProperties {
    readonly id: string;
    readonly name: string;
}

export class BookmarkStartAttributes extends XmlAttributeComponent<IBookmarkStartAttributesProperties> {
    protected readonly xmlKeys = {
        id: "w:id",
        name: "w:name",
    };
}

export interface IBookmarkEndAttributesProperties {
    readonly id: string;
}

export class BookmarkEndAttributes extends XmlAttributeComponent<IBookmarkEndAttributesProperties> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

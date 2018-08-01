import { XmlAttributeComponent } from "file/xml-components";

export interface IBookmarkStartAttributesProperties {
    id: string;
    name: string;
}

export class BookmarkStartAttributes extends XmlAttributeComponent<IBookmarkStartAttributesProperties> {
    protected xmlKeys = {
        id: "w:id",
        name: "w:name",
    };
}

export interface IBookmarkEndAttributesProperties {
    id: string;
}

export class BookmarkEndAttributes extends XmlAttributeComponent<IBookmarkEndAttributesProperties> {
    protected xmlKeys = {
        id: "w:id",
    };
}

import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class BookmarkStartAttributes extends XmlAttributeComponent<{
    readonly id: number;
    readonly name: string;
}> {
    protected readonly xmlKeys: {
        id: string;
        name: string;
    };
}
export declare class BookmarkEndAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys: {
        id: string;
    };
}

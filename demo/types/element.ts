import { Alignment, ElementKinds } from "./node-types";

export type HeadingElementKinds =
    | ElementKinds.heading_1
    | ElementKinds.heading_2
    | ElementKinds.heading_3
    | ElementKinds.heading_4
    | ElementKinds.heading_5
    | ElementKinds.heading_6;

export type BlockElementKinds =
    | ElementKinds.image
    | ElementKinds.paragraph
    | ElementKinds.numberedList
    | ElementKinds.bulletedList
    | ElementKinds.listItem
    | ElementKinds.checkItem
    | ElementKinds.table
    | ElementKinds.tableRow
    | ElementKinds.tableCell
    | ElementKinds.tableContent
    | ElementKinds.code
    | ElementKinds.blockquote
    | ElementKinds.hr
    | ElementKinds.link
    | ElementKinds.inlineCode
    | HeadingElementKinds;

export type InlineElementKinds = ElementKinds.link;

export interface TheBlockElement {
    align?: Alignment;
    textIndent?: number;
    type: BlockElementKinds;
}

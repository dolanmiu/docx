import { Descendant, Element } from "slate";
import { BlockElementKinds, InlineElementKinds } from "./element";
import { Alignment, ElementKinds, LayoutTypes, VerticalAlignment } from "./node-types";
import { TheTableColumn, TheTableOptions } from "./table.types";

export interface TheElement<T = BlockElementKinds | InlineElementKinds> {
    type: T;
    children: Descendant[];
    key?: string;
    _id?: string;
    voids?: boolean;
    align?: Alignment;
    indent?: number;
    textIndent?: number;
    verticalAlign?: VerticalAlignment;
}

export interface ParagraphElement extends TheElement {
    type: ElementKinds.paragraph;
}

export interface BlockQuoteElement extends TheElement {
    type: ElementKinds.blockquote;
}

export interface BulletedListElement extends TheElement {
    type: ElementKinds.bulletedList;
    start?: number;
}

export interface NumberedListElement extends TheElement {
    type: ElementKinds.numberedList;
    start?: number;
}

export interface ListItemElement extends TheElement {
    type: ElementKinds.listItem;
    start?: number;
    children: Element[];
}

export interface LinkElement extends TheElement {
    type: ElementKinds.link;
    url: string;
}

export interface TodoItemElement extends TheElement {
    type: ElementKinds.checkItem;
    checked: boolean;
}

export interface HeadingOneElement extends TheElement {
    type: ElementKinds.heading_1;
}
export interface HeadingTwoElement extends TheElement {
    type: ElementKinds.heading_2;
}
export interface HeadingThreeElement extends TheElement {
    type: ElementKinds.heading_3;
}
export interface HeadingFourElement extends TheElement {
    type: ElementKinds.heading_4;
}
export interface HeadingFiveElement extends TheElement {
    type: ElementKinds.heading_5;
}
export interface HeadingSixElement extends TheElement {
    type: ElementKinds.heading_6;
}

export interface ImageElement extends TheElement {
    type: ElementKinds.image;
    children: EmptyText[];
    file?: File;
    name?: string;
    width?: number;
    height?: number;
    url?: string;
    thumbUrl?: string;
    originUrl?: string;
    align?: Alignment;
    layout?: LayoutTypes;
    reSized?: boolean;
    size?: number;
    externalUrl?: string;
}

export interface TableElement extends TheElement {
    type: ElementKinds.table;
    children: TableRowElement[];
    columns?: TheTableColumn[];
    options?: TheTableOptions;
}

export interface TableRowElement extends TheElement {
    type: ElementKinds.tableRow;
    children: TableCellElement[];
    header?: boolean;
    height?: number;
}

export interface TableCellElement extends TheElement {
    key?: string;
    type: ElementKinds.tableCell;
    colspan?: number;
    rowspan?: number;
    hidden?: boolean;
    backgroundColor?: string;
}

export interface HrElement extends TheElement {
    type: ElementKinds.hr;
    children: EmptyText[];
}

export interface CodeElement extends TheElement {
    type: ElementKinds.code;
    children: EmptyText[];
    content?: string;
    language?: string;
    height?: number;
    autoWrap?: boolean;
}

export interface EditableVoidElement {
    type: "editable-void";
    children: EmptyText[];
}

export interface InlineCodeElement extends TheElement {
    type: ElementKinds.inlineCode;
}

export type CustomElement =
    | BlockQuoteElement
    | NumberedListElement
    | BulletedListElement
    | TodoItemElement
    | HeadingOneElement
    | HeadingTwoElement
    | HeadingThreeElement
    | HeadingFourElement
    | HeadingFiveElement
    | HeadingSixElement
    | ImageElement
    | LinkElement
    | ListItemElement
    | ParagraphElement
    | TableElement
    | TableRowElement
    | TableCellElement
    | HrElement
    | InlineCodeElement
    | CodeElement;

export type CustomText = {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    text: string;
    underlined?: boolean;
    color?: string;
    strike?: boolean;
    [`background-color`]?: string;
};

export type EmptyText = {
    text: string;
};

type Get<T, P extends keyof T> = T[P];
export type CustomElementKinds = Get<Element, "type">;

import { CustomElementKinds } from "./custom-type";

export enum ElementKinds {
    image = "image",
    paragraph = "paragraph",
    headingList = "heading-list",
    heading_1 = "heading-one",
    heading_2 = "heading-two",
    heading_3 = "heading-three",
    heading_4 = "heading-four",
    heading_5 = "heading-five",
    heading_6 = "heading-six",
    numberedList = "numbered-list",
    bulletedList = "bulleted-list",
    listItem = "list-item",
    checkItem = "check-item",
    table = "table",
    tableRow = "table-row",
    tableCell = "table-cell",
    tableContent = "paragraph",
    code = "code",
    blockquote = "block-quote",
    hr = "hr",
    link = "link",
    default = "paragraph",
    inlineCode = "inline-code",
    indent = "indent",
}

export enum Alignment {
    left = "left",
    center = "center",
    right = "right",
}

export enum VerticalAlignment {
    top = "top",
    middle = "middle",
    bottom = "bottom",
}

export enum LayoutTypes {
    wrapLeft = "wrap-left",
    wrapRight = "wrap-right",
}

export enum FontSizes {
    "fontSize12" = "12",
    "fontSize13" = "13",
    "fontSize14" = "14",
    "fontSize15" = "15",
    "fontSize16" = "16",
    "fontSize18" = "18",
    "fontSize20" = "20",
    "fontSize24" = "24",
    "fontSize28" = "28",
    "fontSize32" = "32",
    "fontSize40" = "40",
    "fontSize48" = "48",
}

export const FontSizeTypes = [
    FontSizes.fontSize12,
    FontSizes.fontSize13,
    FontSizes.fontSize14,
    FontSizes.fontSize15,
    FontSizes.fontSize16,
    FontSizes.fontSize20,
    FontSizes.fontSize24,
    FontSizes.fontSize28,
    FontSizes.fontSize32,
    FontSizes.fontSize40,
    FontSizes.fontSize48,
];

export enum Indents {
    indentRight = "indent-right",
    indentLeft = "indent-left",
}

export enum ScrollDirection {
    X,
    Y,
}

export enum MarkTypes {
    bold = "bold",
    italic = "italic",
    underline = "underlined",
    strike = "strike",
    color = "color",
    backgroundColor = "background-color",
    fontSize = "font-size",
}

export enum ToolbarActionTypes {
    split = "split",
    undo = "undo",
    redo = "redo",
    paintformat = "paintformat",
    clean = "clean",
    alignType = "align-type",
    alignLeft = "align-left",
    alignCenter = "align-center",
    alignRight = "align-right",
    verticalAlign = "vertical-align",
    verticalAlignTop = "vertical-align-top",
    verticalAlignMiddle = "vertical-align-middle",
    verticalAlignBottom = "vertical-align-bottom",
    headingList = "heading-list",
    tableRemove = "table-remove",
    tableDeleteRows = "table-delete-rows",
    tableDeleteColumns = "table-delete-columns",
    group = "group",
}

export const MarkProps: Array<MarkTypes> = [
    MarkTypes.backgroundColor,
    MarkTypes.bold,
    MarkTypes.color,
    MarkTypes.italic,
    MarkTypes.strike,
    MarkTypes.underline,
    MarkTypes.fontSize,
];

export const STANDARD_HEADING_TYPES: CustomElementKinds[] = [
    ElementKinds.heading_1,
    ElementKinds.heading_2,
    ElementKinds.heading_3,
    ElementKinds.heading_4,
];

export const HEADING_TYPES: CustomElementKinds[] = [...STANDARD_HEADING_TYPES, ElementKinds.heading_5, ElementKinds.heading_6];

export const ALIGN_BLOCK_TYPES: CustomElementKinds[] = [ElementKinds.default, ElementKinds.listItem, ElementKinds.image, ...HEADING_TYPES];

export const CONTAINER_BLOCKS: CustomElementKinds[] = [ElementKinds.blockquote, ElementKinds.tableCell];

export const LIST_BLOCK_TYPES: CustomElementKinds[] = [ElementKinds.numberedList, ElementKinds.bulletedList];

export const VOID_BLOCK_TYPES: CustomElementKinds[] = [ElementKinds.image, ElementKinds.hr];

export const BLOCK_DELETE_BACKWARD_TYPES: CustomElementKinds[] = [ElementKinds.tableCell];

export const DISABLED_OPERATE_TYPES: CustomElementKinds[] = [ElementKinds.code, ElementKinds.hr];

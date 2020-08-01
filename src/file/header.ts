import { Paragraph } from "./paragraph";
import { Table } from "./table";

export interface IHeaderOptions {
    readonly children: (Paragraph | Table)[];
}

export class Header {
    constructor(public readonly options: IHeaderOptions = { children: [] }) {}
}

export class Footer {
    constructor(public readonly options: IHeaderOptions = { children: [] }) {}
}

import { Paragraph } from "./paragraph";
import { Table } from "./table";

export interface IHeaderOptions {
    readonly children: readonly (Paragraph | Table)[];
}

export class Header {
    public constructor(public readonly options: IHeaderOptions = { children: [] }) {
        // noop
    }
}

export class Footer {
    public constructor(public readonly options: IHeaderOptions = { children: [] }) {
        // noop
    }
}

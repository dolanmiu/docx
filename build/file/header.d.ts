import { Paragraph } from "./paragraph";
import { Table } from "./table";
export interface IHeaderOptions {
    readonly children: (Paragraph | Table)[];
}
export declare class Header {
    readonly options: IHeaderOptions;
    constructor(options?: IHeaderOptions);
}
export declare class Footer {
    readonly options: IHeaderOptions;
    constructor(options?: IHeaderOptions);
}

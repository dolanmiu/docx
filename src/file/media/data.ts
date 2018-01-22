import * as fs from "fs";

export interface IData {
    referenceId: number;
    stream: fs.ReadStream;
    path: string;
    fileName: string;
}

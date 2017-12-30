import * as fs from "fs";

export interface IMediaData {
    referenceId: number;
    stream: fs.ReadStream;
    path: string;
    fileName: string;
}

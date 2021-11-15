import * as JSZip from "jszip";
import { File } from "../../file";
export declare class Compiler {
    private readonly formatter;
    private readonly imageReplacer;
    private readonly numberingReplacer;
    constructor();
    compile(file: File, prettifyXml?: boolean): JSZip;
    private xmlifyFile;
}

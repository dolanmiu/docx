import {Packer} from "./packer";
import * as fs from 'fs';
import {Document} from "../../docx/document";

export class LocalPacker extends Packer {
    private stream: fs.WriteStream
    
    constructor(document: Document, path: string) {
        super(document, null, null);
        this.stream = fs.createWriteStream(path);
    }
   
   pack() {
       super.pack(this.stream);
   }
}
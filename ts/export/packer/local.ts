import {Packer} from "./packer";
import * as fs from 'fs';
import {Document} from "../../docx/document";
import {Properties} from "../../properties";

export class LocalPacker extends Packer {
    private stream: fs.WriteStream
    
    constructor(document: Document, style: any, properties: Properties, path: string) {
        super(document, style, properties);
        this.stream = fs.createWriteStream(path);
    }
   
   pack(): void {
       super.pack(this.stream);
   }
}
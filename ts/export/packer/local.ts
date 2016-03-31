import {Packer} from "./packer";
import * as fs from 'fs';

export class LocalPacker extends Packer {
    private stream: fs.WriteStream
    
    constructor(path: string) {
        super();
        this.stream = fs.createWriteStream(path);
    }
   
   pack() {
       super.pack(this.stream);
   }
}
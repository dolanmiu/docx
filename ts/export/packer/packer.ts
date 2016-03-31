import {archiver, Zip} from "archiver";
import * as fs from 'fs';

export class Packer {
    protected archive: Zip;

    constructor() {
        this.archive = archiver.create("fgf", {});
    }

    pack(output: fs.WriteStream): void {
        this.archive.pipe(output);

        this.archive.bulk([
            {
                expand: true,
                cwd: __dirname + '/template',
                src: ['**', '**/.rels']
            }
        ]);
    }
}
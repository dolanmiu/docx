import * as archiver from "archiver";
import * as fs from 'fs';

export class Packer {
    protected archive: any;

    constructor() {
        this.archive = archiver.create("zip", {});
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
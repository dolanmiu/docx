import * as archiver from "archiver";
import * as fs from "fs";
import {Formatter} from "../formatter";

export abstract class Packer {
    protected archive: any;
    private formatter: Formatter;

    constructor() {
        this.formatter = new Formatter();
        this.archive = archiver.create("zip", {});

        this.archive.on('error', (err) => {
            throw err;
        });
    }

    pack(output: any): void {
        this.archive.pipe(output);

        this.archive.bulk([
            {
                expand: true,
                cwd: __dirname + '/template',
                src: ['**', '**/.rels']
            }
        ]);

        //this.archive.directory(__dirname + "/template", "/");

        this.archive.finalize();
    }
}
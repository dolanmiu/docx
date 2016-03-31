// Type definitions for archiver v0.15.0
// Project: https://github.com/archiverjs/node-archiver
// Definitions by: Esri <https://github.com/archiverjs/node-archiver>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/* =================== USAGE ===================

    import Archiver = require('archiver);
    var archiver = Archiver.create('zip');
    archiver.pipe(FS.createWriteStream('xxx'));
    archiver.append(FS.createReadStream('xxx'));
    archiver.finalize();

 =============================================== */

/// <reference path="../node/node.d.ts" />
declare module "archiver" {
    import * as FS from 'fs';
    import * as STREAM from 'stream';
    
    interface nameInterface {
        name?: string;
    }
        
    export interface Zip extends STREAM.Transform {
        pipe(writeStream: FS.WriteStream): void;
        append(readStream: FS.ReadStream, name: nameInterface): void;
        finalize(): void;
        bulk(mappings: any): void;
    }
    
    interface Options {
        
    }
    
    function archiver(format: string, options?: Options): Zip;
    
    export namespace archiver {
        function create(format: string, options?: Options): Zip;
    }
}

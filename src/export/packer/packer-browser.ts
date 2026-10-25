import type { File } from "@file/file";

import type { IXmlifyedFile } from "./next-compiler";
import { Packer as CorePacker, type PrettifyType } from "./packer-core";

export { PrettifyType } from "./packer-core";

/**
 * Browser document exports using Web Streams, without Node runtime imports.
 *
 * @publicApi
 */
export class Packer extends CorePacker {
    /**
     * Returns a Web Stream containing the completed archive. This buffers the
     * archive, like the Node API; it does not claim incremental ZIP generation.
     * Cancellation prevents delivery after a reader has stopped consuming.
     */
    public static toStream(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): ReadableStream<Uint8Array> {
        let cancelled = false;
        return new ReadableStream<Uint8Array>({
            start: (controller) =>
                this.pack(file, "uint8array", prettify, overrides).then((bytes) => {
                    if (!cancelled) {
                        controller.enqueue(bytes);
                        controller.close();
                    }
                }),
            cancel: () => {
                cancelled = true;
            },
        });
    }
}

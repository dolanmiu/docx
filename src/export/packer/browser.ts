import { Compiler } from "./next-compiler";
import { IPacker } from "./packer";

declare var saveAs;

export class BrowserPacker implements IPacker {
    private readonly packer: Compiler;

    public async pack(filePath: string): Promise<void> {
        filePath = filePath.replace(/.docx$/, "");

        const zip = await this.packer.compile();
        const zipBlob = await zip.generateAsync({ type: "blob" });

        saveAs(zipBlob, `${filePath}.docx`);
    }
}

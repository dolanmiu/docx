import JSZip from "jszip";

import { InputDataType } from "./from-docx";
import { traverse } from "./traverser";
import { toJson } from "./util";

type PatchDetectorOptions = {
    readonly data: InputDataType;
};

/** Detects which patches are needed/present in a template */
export const patchDetector = async ({ data }: PatchDetectorOptions): Promise<readonly string[]> => {
    const zipContent = data instanceof JSZip ? data : await JSZip.loadAsync(data);
    const patches = new Set<string>();

    for (const [key, value] of Object.entries(zipContent.files)) {
        if (!key.endsWith(".xml") && !key.endsWith(".rels")) {
            continue;
        }
        if (key.startsWith("word/") && !key.endsWith(".xml.rels")) {
            const json = toJson(await value.async("text"));
            traverse(json).forEach((p) => findPatchKeys(p.text).forEach((patch) => patches.add(patch)));
        }
    }
    return Array.from(patches);
};

const findPatchKeys = (text: string): readonly string[] => {
    const pattern = /(?<=\{\{).+?(?=\}\})/gs;
    return text.match(pattern) ?? [];
};

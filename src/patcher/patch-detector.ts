import JSZip from "jszip";

import { InputDataType } from "./from-docx";
import { traverse } from "./traverser";
import { toJson } from "./util";

type PatchDetectorOptions = {
    readonly data: InputDataType;
    readonly placeholderDelimiters?: Readonly<{
        readonly start: string;
        readonly end: string;
    }>;
};

/** Detects which patches are needed/present in a template */
export const patchDetector = async ({
    data,
    placeholderDelimiters = { start: "{{", end: "}}" } as const,
}: PatchDetectorOptions): Promise<readonly string[]> => {
    const zipContent = data instanceof JSZip ? data : await JSZip.loadAsync(data);
    const patches = new Set<string>();

    for (const [key, value] of Object.entries(zipContent.files)) {
        if (!key.endsWith(".xml") && !key.endsWith(".rels")) {
            continue;
        }
        if (key.startsWith("word/") && !key.endsWith(".xml.rels")) {
            const json = toJson(await value.async("text"));
            // eslint-disable-next-line functional/immutable-data
            traverse(json).forEach((p) => findPatchKeys(p.text, placeholderDelimiters).forEach((patch) => patches.add(patch)));
        }
    }
    return Array.from(patches);
};

const findPatchKeys = (text: string, delimiters: { readonly start: string; readonly end: string }): readonly string[] => {
    const { start, end } = delimiters;
    const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<=${escapedStart}).+?(?=${escapedEnd})`, "gs");
    return text.match(pattern) ?? [];
};

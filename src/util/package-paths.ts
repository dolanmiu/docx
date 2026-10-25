/**
 * The paths of a package's parts, such as word/document.xml in a .docx file, and the targets of the relationships
 * between them.
 *
 * @module
 */

/**
 * The path of a part's relationships part, such as word/_rels/document.xml.rels for word/document.xml.
 */
export const relationshipsPathOf = (path: string): string => {
    const slash = path.lastIndexOf("/");
    return `${path.slice(0, slash + 1)}_rels/${path.slice(slash + 1)}.rels`;
};

/**
 * The part a relationships part belongs to, or "" for the package's own (_rels/.rels), whose targets are from its root.
 */
export const sourceOfRelationships = (path: string): string => path.replace(/(^|\/)_rels\/([^/]*)\.rels$/, "$1$2");

// A part's folder, with its slash, such as "word/" for word/document.xml, or "" for a part at the package's root
const folderOf = (path: string): string => path.slice(0, path.lastIndexOf("/") + 1);

/**
 * The path of the part a relationship's target refers to: relative to the folder of the part the relationship belongs
 * to, or from the package's root if it starts with "/". Backslashes, which some applications write, are read as slashes.
 *
 * @param from - The path of the part the relationship belongs to
 */
export const resolveTarget = (from: string, target: string): string => {
    const normalized = target.replace(/\\/g, "/");
    return (normalized.startsWith("/") ? normalized : `${folderOf(from)}${normalized}`)
        .split("/")
        .reduce<readonly string[]>((segments, segment) => {
            if (segment === "" || segment === ".") {
                return segments;
            }
            return segment === ".." ? segments.slice(0, -1) : [...segments, segment];
        }, [])
        .join("/");
};

/**
 * A relationship's target for a part, relative to the folder of the part the relationship belongs to, such as
 * "../embeddings/Microsoft_Excel_Worksheet1.xlsx" from word/charts/chart1.xml.
 *
 * @param from - The path of the part the relationship belongs to
 * @param to - The path of the part it refers to
 */
export const relativeTarget = (from: string, to: string): string => {
    const folders = folderOf(from).split("/").filter(Boolean);
    const segments = to.split("/");
    const common = folders.findIndex((folder, index) => index >= segments.length - 1 || segments[index] !== folder);
    const shared = common === -1 ? folders.length : common;
    return [...folders.slice(shared).map(() => ".."), ...segments.slice(shared)].join("/");
};

/**
 * Whether two paths are the same part's. Part names are compared without regard to case, as the Open Packaging
 * Conventions compare them, so a relationship's target such as "Theme/THEME1.xml" from word/document.xml names
 * word/theme/theme1.xml.
 */
export const isSamePart = (path: string, other: string): boolean => path.toLowerCase() === other.toLowerCase();

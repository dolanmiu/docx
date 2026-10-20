/**
 * Writes an OLE package, the OLE object Windows' Object Packager keeps a file in, so Word can embed a file no
 * application embeds itself, such as a sound, a video or a PDF.
 *
 * The package is a compound file, as Word writes one: its root's class is the packager's, and it has three streams.
 * "\1Ole10Native" holds the file, with its name. "\1CompObj" names the packager. "\3ObjInfo" tells Word to show
 * the package as an icon.
 *
 The packager's data in "\1Ole10Native" isn't documented, so it is written as Word writes it, which Apache POI's
 * Ole10Native writes too, and LibreOffice's ownview.cxx reads.
 *
 * References:
 * - [MS-OLEDS] 2.3.6 OLENativeStream and 2.3.8 CompObjStream
 * - [MS-DOC] ODT, the structure "\3ObjInfo" holds: https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-doc/641974b2-ba6c-4615-81a9-285f7d82cf67
 *
 * @module
 */
import { createCompoundFile } from "../compound-file/compound-file";

/** The class of the packager's objects, which Windows names Package */
export const PACKAGE_CLASS_ID = "0003000C-0000-0000-C000-000000000046";

/**
 * Writes the bytes of a run of fields: unsigned 16 and 32-bit little-endian numbers, and bytes.
 */
const concat = (fields: readonly (readonly ["u16" | "u32", number] | Uint8Array)[]): Uint8Array => {
    const length = fields.reduce((total, field) => total + (field instanceof Uint8Array ? field.length : field[0] === "u16" ? 2 : 4), 0);
    const bytes = new Uint8Array(length);
    const view = new DataView(bytes.buffer);
    let offset = 0;
    for (const field of fields) {
        if (field instanceof Uint8Array) {
            bytes.set(field, offset);
            offset += field.length;
        } else if (field[0] === "u16") {
            view.setUint16(offset, field[1], true);
            offset += 2;
        } else {
            view.setUint32(offset, field[1], true);
            offset += 4;
        }
    }
    return bytes;
};

/**
 * A string in the computer's ANSI code page, with a terminating NUL. Only ASCII is the same in every code page, so any
 * other character is "_": Word takes the file's name from the package's Unicode copies of its strings.
 */
const ansi = (text: string): Uint8Array =>
    Uint8Array.from([
        ...Array.from(text, (character) => (character.length === 1 && character.charCodeAt(0) < 0x80 ? character.charCodeAt(0) : 0x5f)),
        0,
    ]);

/**
 * A string in UTF-16, little-endian, without a terminator.
 */
const unicode = (text: string): Uint8Array => {
    const bytes = new Uint8Array(text.length * 2);
    const view = new DataView(bytes.buffer);
    for (let index = 0; index < text.length; index++) {
        view.setUint16(index * 2, text.charCodeAt(index), true);
    }
    return bytes;
};

/**
 * The packager's native data, in the "\1Ole10Native" stream: the file's label, the path it was packaged from, the path
 * it is unpacked to, each in ANSI, then the file, then the three strings again in Unicode. The packager unpacks the file
 * to a file named as the last of the paths, so its extension says what the file opens with. Each is the file's name, as
 * a document made with docx has no path for it.
 */
const createNativeData = (fileName: string, data: Uint8Array): Uint8Array => {
    const name = ansi(fileName);
    // Each Unicode copy has its length in UTF-16 code units
    const unicodeName = [["u32", fileName.length] as const, unicode(fileName)];
    const body = concat([
        // The type of the package's content: a file
        ["u16", 2],
        // Its label, and the path it was packaged from
        name,
        name,
        // Always these, in every package Office writes
        ["u16", 0],
        ["u16", 3],
        // The path it is unpacked to
        ["u32", name.length],
        name,
        ["u32", data.length],
        data,
        // The Unicode copies: the path it is unpacked to, its label, and the path it was packaged from
        ...unicodeName,
        ...unicodeName,
        ...unicodeName,
    ]);
    return concat([["u32", body.length], body]);
};

/**
 * The "\1CompObj" stream, as Word writes it for a package: the header with the packager's class, its type's name, no
 * clipboard format, and its ProgID, then empty Unicode copies.
 */
const createCompObj = (): Uint8Array =>
    concat([
        // The header: a version and byte order mark, and the class after four bytes of 0xFF
        ["u32", 0xfffe0001],
        ["u32", 0x00000a03],
        ["u32", 0xffffffff],
        // The packager's class, its first three fields little-endian
        ["u32", 0x0003000c],
        ["u16", 0],
        ["u16", 0],
        Uint8Array.from([0xc0, 0, 0, 0, 0, 0, 0, 0x46]),
        ["u32", "OLE Package".length + 1],
        ansi("OLE Package"),
        // No clipboard format
        ["u32", 0],
        ["u32", "Package".length + 1],
        ansi("Package"),
        // The marker of the Unicode copies, which are empty
        ["u32", 0x71b239f4],
        ["u32", 0],
        ["u32", 0],
        ["u32", 0],
    ]);

/**
 * The "\3ObjInfo" stream ([MS-DOC] ODT): the object is shown as an icon, in a metafile, as Word writes it for a package.
 */
const OBJECT_INFO = Uint8Array.from([0x40, 0x00, 0x03, 0x00, 0x01, 0x00]);

/**
 * Writes an OLE package of a file, as Word embeds one in word/embeddings/oleObject1.bin.
 */
export const createOlePackage = ({ fileName, data }: { readonly fileName: string; readonly data: Uint8Array }): Uint8Array =>
    createCompoundFile(
        [
            { name: "\u0001Ole10Native", data: createNativeData(fileName, data) },
            { name: "\u0001CompObj", data: createCompObj() },
            { name: "\u0003ObjInfo", data: OBJECT_INFO },
        ],
        { classId: PACKAGE_CLASS_ID },
    );

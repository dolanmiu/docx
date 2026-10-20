// cspell:ignore Résumé
import { describe, expect, it } from "vitest";

import { readCompoundFile } from "tests/compound-file";

import { PACKAGE_CLASS_ID, createOlePackage } from "./ole-package";

const hex = (bytes: Uint8Array): string => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(" ");

/**
 * Reads the packager's native data as Word writes it, field by field: the file's label, its paths and its data, then the
 * Unicode copies of its strings.
 */
const readNativeData = (stream: Uint8Array) => {
    const view = new DataView(stream.buffer, stream.byteOffset, stream.byteLength);
    let offset = 0;
    const u16 = (): number => {
        offset += 2;
        return view.getUint16(offset - 2, true);
    };
    const u32 = (): number => {
        offset += 4;
        return view.getUint32(offset - 4, true);
    };
    const bytes = (length: number): Uint8Array => {
        offset += length;
        return stream.subarray(offset - length, offset);
    };
    const ansi = (): string => {
        const end = stream.indexOf(0, offset);
        const text = String.fromCharCode(...stream.subarray(offset, end));
        offset = end + 1;
        return text;
    };
    const unicode = (): string => {
        const length = u32();
        return String.fromCharCode(...Array.from({ length }, () => u16()));
    };

    const size = u32();
    const type = u16();
    const label = ansi();
    const path = ansi();
    const flags = hex(bytes(4));
    const tempPathLength = u32();
    const tempPath = ansi();
    const data = bytes(u32());
    const unicodeStrings = [unicode(), unicode(), unicode()];
    return { size, type, label, path, flags, tempPathLength, tempPath, data, unicodeStrings, rest: stream.length - offset };
};

describe("createOlePackage", () => {
    it("should write a compound file of the packager's class, with Word's three streams", () => {
        const file = readCompoundFile(createOlePackage({ fileName: "song.mp3", data: new Uint8Array([1, 2, 3]) }));

        expect(file.entries[0].classId).toBe(PACKAGE_CLASS_ID);
        expect([...file.streams.keys()].sort()).toEqual(["\u0001CompObj", "\u0001Ole10Native", "\u0003ObjInfo"]);
    });

    it("should name the packager in its CompObj stream, byte for byte as Word 2010 and later do", () => {
        const file = readCompoundFile(createOlePackage({ fileName: "song.mp3", data: new Uint8Array([1, 2, 3]) }));

        expect(hex(file.streams.get("\u0001CompObj")!)).toBe(
            // The header, with the packager's class after four bytes of 0xFF
            "01 00 fe ff 03 0a 00 00 ff ff ff ff 0c 00 03 00 00 00 00 00 c0 00 00 00 00 00 00 46 " +
                // "OLE Package", no clipboard format and "Package", then the Unicode marker and three empty strings
                "0c 00 00 00 4f 4c 45 20 50 61 63 6b 61 67 65 00 00 00 00 00 08 00 00 00 50 61 63 6b 61 67 65 00 " +
                "f4 39 b2 71 00 00 00 00 00 00 00 00 00 00 00 00",
        );
    });

    it("should tell Word to show the package as an icon, as Word does", () => {
        const file = readCompoundFile(createOlePackage({ fileName: "song.mp3", data: new Uint8Array([1, 2, 3]) }));

        expect(hex(file.streams.get("\u0003ObjInfo")!)).toBe("40 00 03 00 01 00");
    });

    it("should keep the file, with its name as its label and both its paths, in ANSI and in Unicode", () => {
        const data = new Uint8Array(5000).map((_, index) => index % 256);
        const file = readCompoundFile(createOlePackage({ fileName: "song.mp3", data }));
        const stream = file.streams.get("\u0001Ole10Native")!;

        expect(readNativeData(stream)).toEqual({
            size: stream.length - 4,
            type: 2,
            label: "song.mp3",
            path: "song.mp3",
            flags: "00 00 03 00",
            tempPathLength: 9,
            tempPath: "song.mp3",
            data,
            unicodeStrings: ["song.mp3", "song.mp3", "song.mp3"],
            rest: 0,
        });
    });

    it("should write a character beyond ASCII as _ in the ANSI strings, and as itself in the Unicode ones", () => {
        const file = readCompoundFile(createOlePackage({ fileName: "Résumé 🎵.wav", data: new Uint8Array([1]) }));
        const native = readNativeData(file.streams.get("\u0001Ole10Native")!);

        // The emoji is two UTF-16 code units, but one character
        expect(native).toMatchObject({ label: "R_sum_ _.wav", path: "R_sum_ _.wav", tempPath: "R_sum_ _.wav", tempPathLength: 13 });
        expect(native.unicodeStrings).toEqual(["Résumé 🎵.wav", "Résumé 🎵.wav", "Résumé 🎵.wav"]);
    });

    it("should package an empty file", () => {
        const file = readCompoundFile(createOlePackage({ fileName: "empty.txt", data: new Uint8Array() }));

        expect(readNativeData(file.streams.get("\u0001Ole10Native")!)).toMatchObject({ data: new Uint8Array(), rest: 0 });
    });
});

import { describe, expect, it } from "vitest";

import { encodeWindows1252 } from "./code-page";

describe("encodeWindows1252", () => {
    it("should keep ASCII as it is", () => {
        expect(encodeWindows1252('MsgBox "Hi"\r\n', "Code")).toEqual(
            Uint8Array.from('MsgBox "Hi"\r\n', (character) => character.charCodeAt(0)),
        );
    });

    it("should encode every character Windows-1252 has as the byte the code page decodes to it", () => {
        const decoder = new TextDecoder("windows-1252");
        // The bytes Windows-1252 has no character for, which decoders give as the C1 control characters
        const unused = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d]);
        const all = Array.from({ length: 256 }, (_, byte) => byte).filter((byte) => !unused.has(byte));

        expect(encodeWindows1252(decoder.decode(Uint8Array.from(all)), "Code")).toEqual(Uint8Array.from(all));
    });

    it("should encode the characters Windows-1252 has where Latin-1 has control characters", () => {
        expect(encodeWindows1252("€‘’“”–—™", "Code")).toEqual(Uint8Array.from([0x80, 0x91, 0x92, 0x93, 0x94, 0x96, 0x97, 0x99]));
    });

    it("should throw for a character Windows-1252 doesn't have, saying how to write it", () => {
        expect(() => encodeWindows1252('MsgBox "中"', "The code of Greetings")).toThrow(
            'The code of Greetings has "中", which VBA can\'t keep in its code page, Windows-1252. Write it with ChrW instead, such as ChrW(&H4E2D) in a string',
        );
    });

    it("should throw for a control character Windows-1252 has no byte for", () => {
        expect(() => encodeWindows1252("\u0081", "Code")).toThrow("ChrW(&H81)");
    });
});

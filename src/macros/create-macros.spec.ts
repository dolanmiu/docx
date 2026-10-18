import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { Document, Packer, Paragraph } from "docx";
import { decompress, readCompoundFile } from "tests/macros";

import { createMacros } from "./create-macros";

const text = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

/** The streams of the project, by their paths */
const streamsOf = (options: Parameters<typeof createMacros>[0]): ReadonlyMap<string, Uint8Array> =>
    readCompoundFile(createMacros(options).project).streams;

/** A module's code, as VBA reads it from its stream */
const sourceOf = (streams: ReadonlyMap<string, Uint8Array>, name: string): string => text(decompress(streams.get(`VBA/${name}`)!));

type Record = { readonly id: number; readonly data: Uint8Array };

/**
 * The records of the dir stream, each its id and data. PROJECTVERSION's size is always 4, before 6 bytes of data.
 */
const dirRecordsOf = (streams: ReadonlyMap<string, Uint8Array>): readonly Record[] => {
    const dir = decompress(streams.get("VBA/dir")!);
    const view = new DataView(dir.buffer);
    // eslint-disable-next-line functional/prefer-readonly-type
    const records: Record[] = [];
    for (let offset = 0; offset < dir.length;) {
        const id = view.getUint16(offset, true);
        const size = id === 0x0009 ? 6 : view.getUint32(offset + 2, true);
        // eslint-disable-next-line functional/immutable-data
        records.push({ id, data: dir.subarray(offset + 6, offset + 6 + size) });
        offset += 6 + size;
    }
    return records;
};

/**
 * Reverses VBA's obfuscation of one of the project's properties, given as hexadecimal digits.
 *
 * Reference: [MS-OVBA] 2.4.3.3 Decryption
 */
const deobfuscate = (
    digits: string,
    projectId: string,
): { readonly version: number; readonly keyMatches: boolean; readonly length: number; readonly data: readonly number[] } => {
    /* eslint-disable no-bitwise */
    const bytes = digits.match(/../g)!.map((pair) => parseInt(pair, 16));
    const [seed, versionEncrypted, projectKeyEncrypted, ...rest] = bytes;
    const projectKey = seed ^ projectKeyEncrypted;
    let unencrypted = projectKey;
    let encrypted = projectKeyEncrypted;
    let previousEncrypted = versionEncrypted;
    const plain = rest.map((byteEncrypted) => {
        const byte = byteEncrypted ^ ((previousEncrypted + unencrypted) & 0xff);
        previousEncrypted = encrypted;
        encrypted = byteEncrypted;
        unencrypted = byte;
        return byte;
    });
    const [length0, length1, length2, length3, ...data] = plain.slice((seed & 6) / 2);
    return {
        version: seed ^ versionEncrypted,
        keyMatches: [...projectId].reduce((sum, character) => (sum + character.charCodeAt(0)) & 0xff, 0) === projectKey,
        length: length0 | (length1 << 8) | (length2 << 16) | (length3 << 24),
        data,
    };
    /* eslint-enable no-bitwise */
};

describe("deobfuscate", () => {
    // [MS-OVBA] 3.1.6 PROJECT Stream Example, which checks the test's own deobfuscation
    it("should read [MS-OVBA]'s example project's properties", () => {
        const id = "{917DED54-440B-4FD1-A5C1-74ACF261E600}";

        expect(deobfuscate("0705D8E3D8EDDBF1DBF1DBF1DBF1", id)).toMatchObject({ version: 2, keyMatches: true, length: 4 });
        expect(deobfuscate("0E0CD1ECDFF4E7F5E7F5E7", id)).toEqual({ version: 2, keyMatches: true, length: 1, data: [0x00] });
        expect(deobfuscate("1517CAF1D6F9D7F9D706", id)).toEqual({ version: 2, keyMatches: true, length: 1, data: [0xff] });
    });
});

describe("createMacros", () => {
    it("should write a VBA project with the document's module, ThisDocument, and the given modules, in a compound file", () => {
        const streams = streamsOf({
            modules: [{ name: "Formatting", code: "Sub MakeBold()\nEnd Sub" }],
            classModules: [{ name: "Counter", code: "Public Count As Long" }],
        });

        expect([...streams.keys()].sort()).toEqual([
            "PROJECT",
            "PROJECTwm",
            "VBA/Counter",
            "VBA/Formatting",
            "VBA/ThisDocument",
            "VBA/_VBA_PROJECT",
            "VBA/dir",
        ]);
    });

    it("should write no compiled cache, so VBA compiles the code again", () => {
        // Reserved1, Version 0xFFFF, which tells VBA the cache isn't its own, Reserved2 and Reserved3
        expect(streamsOf({}).get("VBA/_VBA_PROJECT")).toEqual(Uint8Array.from([0xcc, 0x61, 0xff, 0xff, 0x00, 0x01, 0x00]));
    });

    it("should write the project's properties, with each module, unlocked, without a password, and shown", () => {
        const project = text(
            streamsOf({
                modules: [{ name: "Formatting", code: "" }],
                classModules: [{ name: "Counter", code: "" }],
            }).get("PROJECT")!,
        );
        const lines = project.split("\r\n");
        const property = (name: string): string => lines.find((line) => line.startsWith(`${name}=`))!.slice(name.length + 2, -1);
        const id = property("ID");

        expect(project.endsWith("\r\n")).toBe(true);
        expect(lines).toEqual([
            expect.stringMatching(/^ID="\{[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\}"$/),
            "Document=ThisDocument/&H00000000",
            "Module=Formatting",
            "Class=Counter",
            'Name="Project"',
            'HelpContextID="0"',
            'VersionCompatible32="393222000"',
            expect.stringMatching(/^CMG="[0-9A-F]{22,28}"$/),
            expect.stringMatching(/^DPB="[0-9A-F]{16,}"$/),
            expect.stringMatching(/^GC="[0-9A-F]{16,22}"$/),
            "",
            "[Host Extender Info]",
            "&H00000001={3832D640-CF90-11CF-8E43-00A0C911005A};VBE;&H00000000",
            "",
            "[Workspace]",
            "ThisDocument=0, 0, 0, 0, C",
            "Formatting=0, 0, 0, 0, C",
            "Counter=0, 0, 0, 0, C",
            "",
        ]);
        expect(deobfuscate(property("CMG"), id)).toEqual({ version: 2, keyMatches: true, length: 4, data: [0, 0, 0, 0] });
        expect(deobfuscate(property("DPB"), id)).toEqual({ version: 2, keyMatches: true, length: 1, data: [0x00] });
        expect(deobfuscate(property("GC"), id)).toEqual({ version: 2, keyMatches: true, length: 1, data: [0xff] });
    });

    it("should write the modules' names in Unicode too, in their order, then a terminator", () => {
        const names = streamsOf({ modules: [{ name: "Formatting", code: "" }] }).get("PROJECTwm")!;
        const utf16 = (name: string): readonly number[] => [...name].flatMap((character) => [character.charCodeAt(0), 0]);

        expect([...names]).toEqual([
            ...Uint8Array.from("ThisDocument", (character) => character.charCodeAt(0)),
            0,
            ...utf16("ThisDocument"),
            0,
            0,
            ...Uint8Array.from("Formatting", (character) => character.charCodeAt(0)),
            0,
            ...utf16("Formatting"),
            0,
            0,
            0,
            0,
        ]);
    });

    it("should write the project's information, its references, and each module's, as Word does", () => {
        const records = dirRecordsOf(
            streamsOf({ modules: [{ name: "Formatting", code: "" }], classModules: [{ name: "Counter", code: "" }] }),
        );
        const ids = records.map(({ id }) => id);
        const data = (id: number): readonly string[] => records.filter((record) => record.id === id).map((record) => text(record.data));

        // PROJECTINFORMATION, the references, PROJECTMODULES, then a MODULE record for each module and the terminator
        expect(ids).toEqual([
            0x0001,
            0x0002,
            0x0014,
            0x0003,
            0x0004,
            0x0005,
            0x0040,
            0x0006,
            0x003d,
            0x0007,
            0x0008,
            0x0009,
            0x000c,
            0x003c,
            ...[0x0016, 0x003e, 0x000d],
            ...[0x0016, 0x003e, 0x000e],
            ...[0x0016, 0x003e, 0x000d],
            0x000f,
            0x0013,
            ...[0x0019, 0x0047, 0x001a, 0x0032, 0x001c, 0x0048, 0x0031, 0x001e, 0x002c, 0x0022, 0x002b],
            ...[0x0019, 0x0047, 0x001a, 0x0032, 0x001c, 0x0048, 0x0031, 0x001e, 0x002c, 0x0021, 0x002b],
            ...[0x0019, 0x0047, 0x001a, 0x0032, 0x001c, 0x0048, 0x0031, 0x001e, 0x002c, 0x0022, 0x002b],
            0x0010,
        ]);
        // Windows-1252, the project's name, and its three modules
        expect([...records.find(({ id }) => id === 0x0003)!.data]).toEqual([0xe4, 0x04]);
        expect(data(0x0004)).toEqual(["Project"]);
        expect([...records.find(({ id }) => id === 0x000f)!.data]).toEqual([3, 0]);
        expect(data(0x0016)).toEqual(["stdole", "Normal", "Office"]);
        expect(data(0x0019)).toEqual(["ThisDocument", "Formatting", "Counter"]);
        expect(data(0x001a)).toEqual(["ThisDocument", "Formatting", "Counter"]);
        // Each module's code starts at the start of its stream
        expect(records.filter(({ id }) => id === 0x0031).map((record) => [...record.data])).toEqual([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ]);
    });

    it("should write each module's attributes before its code, with its lines ending in CR LF", () => {
        const streams = streamsOf({
            thisDocument: 'Private Sub Document_Open()\n    MsgBox "Hi"\nEnd Sub\n',
            modules: [{ name: "Formatting", code: "Sub MakeBold()\r\n    Selection.Font.Bold = True\rEnd Sub" }],
            classModules: [{ name: "Counter", code: "Public Count As Long" }],
        });

        expect(sourceOf(streams, "ThisDocument")).toBe(
            [
                'Attribute VB_Name = "ThisDocument"',
                'Attribute VB_Base = "1Normal.ThisDocument"',
                "Attribute VB_GlobalNameSpace = False",
                "Attribute VB_Creatable = False",
                "Attribute VB_PredeclaredId = True",
                "Attribute VB_Exposed = True",
                "Attribute VB_TemplateDerived = True",
                "Attribute VB_Customizable = True",
                "Private Sub Document_Open()",
                '    MsgBox "Hi"',
                "End Sub",
                "",
            ].join("\r\n"),
        );
        expect(sourceOf(streams, "Formatting")).toBe(
            ['Attribute VB_Name = "Formatting"', "Sub MakeBold()", "    Selection.Font.Bold = True", "End Sub", ""].join("\r\n"),
        );
        expect(sourceOf(streams, "Counter")).toBe(
            [
                'Attribute VB_Name = "Counter"',
                'Attribute VB_Base = "0{FCFB3D2A-A0FA-1068-A738-08002B3371B5}"',
                "Attribute VB_GlobalNameSpace = False",
                "Attribute VB_Creatable = False",
                "Attribute VB_PredeclaredId = False",
                "Attribute VB_Exposed = False",
                "Attribute VB_TemplateDerived = False",
                "Attribute VB_Customizable = False",
                "Public Count As Long",
                "",
            ].join("\r\n"),
        );
    });

    it("should write ThisDocument with only its attributes when it has no code", () => {
        expect(sourceOf(streamsOf({}), "ThisDocument").split("\r\n")).toHaveLength(9);
    });

    it("should write code in Windows-1252", () => {
        const source = decompress(streamsOf({ modules: [{ name: "Text", code: 'Const Name = "Café"' }] }).get("VBA/Text")!);

        expect([...source.subarray(-4, -3)]).toEqual([0xe9]);
    });

    describe("events", () => {
        it("should list the events of the document that ThisDocument handles", () => {
            const { events } = createMacros({
                thisDocument: [
                    "Private Sub Document_Open()",
                    "End Sub",
                    "public sub document_close()",
                    "End Sub",
                    "Sub Document_New()",
                    "End Sub",
                    "  Private Static Sub Document_ContentControlOnExit(ByVal ContentControl As ContentControl, Cancel As Boolean)",
                    "End Sub",
                    "Private Sub Document_ContentControlBeforeStoreUpdate (ByVal ContentControl As ContentControl, Content As String)",
                    "End Sub",
                ].join("\n"),
            });

            expect(events).toEqual(["open", "close", "new", "contentControlOnExit", "contentControlBeforeStoreUpdate"]);
        });

        it("should list every event Word has, once", () => {
            const names = [
                "New",
                "Open",
                "Close",
                "Sync",
                "XMLAfterInsert",
                "XMLBeforeDelete",
                "ContentControlAfterAdd",
                "ContentControlBeforeDelete",
                "ContentControlOnExit",
                "ContentControlOnEnter",
                "ContentControlBeforeStoreUpdate",
                "ContentControlBeforeContentUpdate",
                "BuildingBlockInsert",
            ];
            const thisDocument = [...names, "Open"].map((name) => `Private Sub Document_${name}()\nEnd Sub`).join("\n");

            expect(createMacros({ thisDocument }).events).toEqual([
                "new",
                "open",
                "close",
                "sync",
                "xmlAfterInsert",
                "xmlBeforeDelete",
                "contentControlAfterAdd",
                "contentControlBeforeDelete",
                "contentControlOnExit",
                "contentControlOnEnter",
                "contentControlBeforeStoreUpdate",
                "contentControlBeforeContentUpdate",
                "buildingBlockInsert",
            ]);
        });

        it("should leave out a commented out handler, a handler in another module, and a procedure that isn't an event", () => {
            const { events } = createMacros({
                thisDocument:
                    "' Private Sub Document_Open()\nPrivate Sub Document_Print()\nEnd Sub\nPrivate Function Document_Close()\nEnd Function",
                modules: [{ name: "Events", code: "Sub Document_Open()\nEnd Sub" }],
            });

            expect(events).toEqual([]);
        });
    });

    describe("module names", () => {
        it.each(["1Module", "My Module", "Café", "_Private", "A".repeat(32), ""])("should throw for the name %j", (name) => {
            expect(() => createMacros({ modules: [{ name, code: "" }] })).toThrow(
                `Invalid module name "${name}". Expected a letter, then letters, digits and underscores, up to 31 of them, such as "Formatting"`,
            );
        });

        it("should allow a name of 31 letters, digits and underscores", () => {
            const name = `A_1${"b".repeat(28)}`;

            expect(readCompoundFile(createMacros({ modules: [{ name, code: "" }] }).project).streams.has(`VBA/${name}`)).toBe(true);
        });

        it("should throw for two modules with the same name, ignoring case, even when one is a class module", () => {
            expect(() =>
                createMacros({ modules: [{ name: "Formatting", code: "" }], classModules: [{ name: "FORMATTING", code: "" }] }),
            ).toThrow('Invalid module name "FORMATTING". Formatting is already a name in the project');
        });

        it.each(["ThisDocument", "thisdocument", "Project", "VBA", "Word", "stdole", "Normal", "Office"])(
            "should throw for %j, a name the project has already",
            (name) => {
                expect(() => createMacros({ modules: [{ name, code: "" }] })).toThrow(`Invalid module name "${name}".`);
            },
        );
    });

    it("should throw for code with a character Windows-1252 doesn't have, saying which module it is in", () => {
        expect(() => createMacros({ modules: [{ name: "Greetings", code: 'MsgBox "你好"' }] })).toThrow(
            'The code of Greetings has "你", which VBA can\'t keep in its code page, Windows-1252.',
        );
    });

    it("should give a document a VBA project and the events it handles, as a .docm", async () => {
        const macros = createMacros({ thisDocument: 'Private Sub Document_Open()\n    MsgBox "Hi"\nEnd Sub' });
        const doc = new Document({ macros, sections: [{ children: [new Paragraph("Hello")] }] });
        const zip = await JSZip.loadAsync(await Packer.toArrayBuffer(doc));

        expect(await zip.file("word/vbaProject.bin")!.async("uint8array")).toEqual(macros.project);
        expect(await zip.file("word/vbaData.xml")!.async("string")).toContain("<wne:docEvents><wne:eventDocOpen/></wne:docEvents>");
        expect(await zip.file("[Content_Types].xml")!.async("string")).toContain(
            '<Override ContentType="application/vnd.ms-word.document.macroEnabled.main+xml" PartName="/word/document.xml"/>',
        );
    });
});

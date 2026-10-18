/**
 * Writes a document's VBA macros from their code: the VBA project file Word keeps them in, vbaProject.bin.
 *
 * Reference: [MS-OVBA] Office VBA File Format Structure
 *
 * @module
 */
/* eslint-disable no-bitwise -- the project's records and its obfuscated properties are bytes */
import type { DocumentMacroEvent, DocumentMacros } from "docx";

import { CODE_PAGE, encodeWindows1252 } from "./code-page";
import { createCompoundFile } from "./compound-file";
import { compress } from "./compression";

/**
 * A module of VBA code, as the VBA editor shows it.
 *
 * @publicApi
 */
export type MacroModule = {
    /**
     * The module's name, such as "Formatting". A macro in it is "Formatting.MacroName" when the macro's name alone could
     * be another module's too. It starts with a letter, then has letters, digits and underscores, up to 31 of them
     */
    readonly name: string;
    /** The module's code, as it is typed in the VBA editor */
    readonly code: string;
};

/**
 * Options for {@link createMacros}.
 *
 * @publicApi
 */
export type MacrosOptions = {
    /**
     * The code of the document's own module, ThisDocument in the VBA editor, where the document's events are handled,
     * such as `Document_Open` when it opens
     */
    readonly thisDocument?: string;
    /** Modules, with the macros Word lists in its Macros dialog, and the procedures and functions they use */
    readonly modules?: readonly MacroModule[];
    /** Class modules, which define classes of objects */
    readonly classModules?: readonly MacroModule[];
};

type ProjectModule = {
    readonly name: string;
    readonly kind: "document" | "module" | "class";
    readonly source: Uint8Array;
};

// The project's name, as Word names a document's project. Word lists macros under it, such as
// Project.Formatting.MacroName
const PROJECT_NAME = "Project";

// The id of the project's type library. Word gives each project its own, but VBA doesn't need it to be unique: copies of
// a .docm, open together, share theirs
const PROJECT_ID = "{6D8A8E5B-1C9F-4E2B-9A4D-3B5F7C2E1D60}";

// The libraries Word's projects refer to: OLE Automation, the document's template, Normal, and Office's library. VBA and
// Word's own libraries are always there, without a reference
const REFERENCES = [
    {
        name: "stdole",
        registered: "*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\System32\\stdole2.tlb#OLE Automation",
    },
    { name: "Normal", project: "*\\CNormal" },
    {
        name: "Office",
        registered:
            "*\\G{2DF8D04C-5BFA-101B-BDE5-00AA0044DE52}#2.0#0#C:\\Program Files\\Common Files\\Microsoft Shared\\OFFICE16\\MSO.DLL#Microsoft Office 16.0 Object Library",
    },
] as const;

// The names of the project and of the libraries it refers to, which a module can't have too
const TAKEN_NAMES = ["ThisDocument", PROJECT_NAME, "VBA", "Word", ...REFERENCES.map(({ name }) => name)];

// The attributes VBA keeps at the top of each kind of module, which the VBA editor doesn't show. VB_Base is what the
// module extends: ThisDocument extends the ThisDocument of the document's template, Normal, and a class module VBA's
// class
const ATTRIBUTES: Readonly<Record<ProjectModule["kind"], (name: string) => string>> = {
    document: (name) =>
        [
            `Attribute VB_Name = "${name}"`,
            'Attribute VB_Base = "1Normal.ThisDocument"',
            "Attribute VB_GlobalNameSpace = False",
            "Attribute VB_Creatable = False",
            "Attribute VB_PredeclaredId = True",
            "Attribute VB_Exposed = True",
            "Attribute VB_TemplateDerived = True",
            "Attribute VB_Customizable = True",
        ].join("\r\n"),
    module: (name) => `Attribute VB_Name = "${name}"`,
    class: (name) =>
        [
            `Attribute VB_Name = "${name}"`,
            'Attribute VB_Base = "0{FCFB3D2A-A0FA-1068-A738-08002B3371B5}"',
            "Attribute VB_GlobalNameSpace = False",
            "Attribute VB_Creatable = False",
            "Attribute VB_PredeclaredId = False",
            "Attribute VB_Exposed = False",
            "Attribute VB_TemplateDerived = False",
            "Attribute VB_Customizable = False",
        ].join("\r\n"),
};

const uint16 = (value: number): readonly number[] => [value & 0xff, (value >> 8) & 0xff];
const uint32 = (value: number): readonly number[] => [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff];
const utf16 = (text: string): readonly number[] => [...text].flatMap((character) => uint16(character.charCodeAt(0)));

/**
 * A record of the project's module information: its id, the size of its data, then its data.
 */
const record = (id: number, data: readonly number[] | Uint8Array): readonly number[] => [...uint16(id), ...uint32(data.length), ...data];

/**
 * Obfuscates one of the project's properties as VBA does, as hexadecimal digits: whether it is locked, its password and
 * whether it is shown.
 *
 * Reference: [MS-OVBA] 2.4.3.2 Encryption
 *
 * @param seed - Any byte. Its bits 1 and 2 are how many bytes of padding go before the data
 */
const obfuscate = (data: readonly number[], seed: number): string => {
    const version = 2;
    // The sum of the bytes of the project's id, to a byte
    const projectKey = [...PROJECT_ID].reduce((sum, character) => (sum + character.charCodeAt(0)) & 0xff, 0);
    const versionEncrypted = seed ^ version;
    const projectKeyEncrypted = seed ^ projectKey;
    const output = [seed, versionEncrypted, projectKeyEncrypted];
    let unencrypted = projectKey;
    let encrypted = projectKeyEncrypted;
    let previousEncrypted = versionEncrypted;
    const write = (byte: number): void => {
        const value = (byte ^ ((previousEncrypted + unencrypted) & 0xff)) & 0xff;
        // eslint-disable-next-line functional/immutable-data
        output.push(value);
        previousEncrypted = encrypted;
        encrypted = value;
        unencrypted = byte;
    };
    const padding = (seed & 6) / 2;
    for (let index = 0; index < padding; index++) {
        write(0);
    }
    for (const byte of [...uint32(data.length), ...data]) {
        write(byte);
    }
    return output.map((byte) => byte.toString(16).toUpperCase().padStart(2, "0")).join("");
};

/**
 * The PROJECT stream: the project's properties, as text.
 *
 * Reference: [MS-OVBA] 2.3.1 PROJECT Stream
 */
const createProjectStream = (modules: readonly ProjectModule[]): Uint8Array => {
    const items = modules.map(({ name, kind }) =>
        kind === "document" ? `Document=${name}/&H00000000` : kind === "module" ? `Module=${name}` : `Class=${name}`,
    );
    const lines = [
        `ID="${PROJECT_ID}"`,
        ...items,
        `Name="${PROJECT_NAME}"`,
        'HelpContextID="0"',
        'VersionCompatible32="393222000"',
        // Not locked, with no password, and shown
        `CMG="${obfuscate(uint32(0), 0x8a)}"`,
        `DPB="${obfuscate([0x00], 0xa3)}"`,
        `GC="${obfuscate([0xff], 0xbc)}"`,
        "",
        "[Host Extender Info]",
        "&H00000001={3832D640-CF90-11CF-8E43-00A0C911005A};VBE;&H00000000",
        "",
        // The modules' windows in the VBA editor, closed
        "[Workspace]",
        ...modules.map(({ name }) => `${name}=0, 0, 0, 0, C`),
    ];
    return encodeWindows1252(lines.map((line) => `${line}\r\n`).join(""), "The project");
};

/**
 * The PROJECTwm stream: the modules' names in Unicode too.
 *
 * Reference: [MS-OVBA] 2.3.3 PROJECTwm Stream
 */
const createNamesStream = (modules: readonly ProjectModule[]): Uint8Array =>
    Uint8Array.from([...modules.flatMap(({ name }) => [...encodeWindows1252(name, "A module's name"), 0, ...utf16(name), 0, 0]), 0, 0]);

/**
 * The dir stream: the project's information, the libraries it refers to and its modules, compressed.
 *
 * Reference: [MS-OVBA] 2.3.4.2 dir Stream
 */
const createDirStream = (modules: readonly ProjectModule[]): Uint8Array => {
    const name = (text: string): readonly number[] => [...encodeWindows1252(text, "A name")];
    const information = [
        // For 32-bit Windows, which VBA compiles the project for again on any other
        ...record(0x0001, uint32(1)),
        // English, which VBA keeps the project in on any system
        ...record(0x0002, uint32(0x0409)),
        ...record(0x0014, uint32(0x0409)),
        ...record(0x0003, uint16(CODE_PAGE)),
        ...record(0x0004, name(PROJECT_NAME)),
        // No description or help file, in the code page then in Unicode
        ...record(0x0005, []),
        ...record(0x0040, []),
        ...record(0x0006, []),
        ...record(0x003d, []),
        ...record(0x0007, uint32(0)),
        ...record(0x0008, uint32(0)),
        // The project's version, its major version then its minor, after a size that is always 4
        ...uint16(0x0009),
        ...uint32(4),
        ...uint32(1),
        ...uint16(0),
        // No compilation constants
        ...record(0x000c, []),
        ...record(0x003c, []),
    ];
    const references = REFERENCES.flatMap((reference) => {
        const referenceName = [...record(0x0016, name(reference.name)), ...record(0x003e, utf16(reference.name))];
        if ("project" in reference) {
            const projectId = name(reference.project);
            // Its absolute and relative paths, then the version of the project it refers to
            return [
                ...referenceName,
                ...record(0x000e, [
                    ...uint32(projectId.length),
                    ...projectId,
                    ...uint32(projectId.length),
                    ...projectId,
                    ...uint32(1),
                    ...uint16(0),
                ]),
            ];
        }
        const libraryId = name(reference.registered);
        return [...referenceName, ...record(0x000d, [...uint32(libraryId.length), ...libraryId, ...uint32(0), ...uint16(0)])];
    });
    const moduleRecords = modules.flatMap((module) => [
        ...record(0x0019, name(module.name)),
        ...record(0x0047, utf16(module.name)),
        // The module's stream, which has its name
        ...record(0x001a, name(module.name)),
        ...record(0x0032, utf16(module.name)),
        ...record(0x001c, []),
        ...record(0x0048, []),
        // Where the module's code starts in its stream, after a cache of the compiled code, which there is none of
        ...record(0x0031, uint32(0)),
        ...record(0x001e, uint32(0)),
        ...record(0x002c, uint16(0xffff)),
        ...record(module.kind === "module" ? 0x0021 : 0x0022, []),
        ...record(0x002b, []),
    ]);
    return compress(
        Uint8Array.from([
            ...information,
            ...references,
            ...record(0x000f, uint16(modules.length)),
            ...record(0x0013, uint16(0xffff)),
            ...moduleRecords,
            ...record(0x0010, []),
        ]),
    );
};

const NAME = /^[A-Za-z][A-Za-z0-9_]{0,30}$/;

// The document's events, by their names in VBA after "Document_", in capitals
const EVENTS = new Map<string, DocumentMacroEvent>(
    (
        [
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
        ] as const
    ).map((event) => [event.toUpperCase(), event]),
);

// A Sub that handles an event of the document, such as "Private Sub Document_Open()"
const EVENT_HANDLER = /^[ \t]*(?:(?:Private|Public|Friend)[ \t]+)?(?:Static[ \t]+)?Sub[ \t]+Document_(\w+)[ \t]*\(/gim;

/**
 * The events of the document that ThisDocument's code has a handler for, which Word runs the handlers of.
 */
const findEvents = (code: string): readonly DocumentMacroEvent[] => [
    ...new Set([...code.matchAll(EVENT_HANDLER)].flatMap(([, name]) => EVENTS.get(name.toUpperCase()) ?? [])),
];

/**
 * Writes a document's VBA macros from their code, for the document's `macros`: the VBA project, and the events of the
 * document that ThisDocument's code handles, such as `Document_Open`. The document is then a macro-enabled document,
 * which Word opens from a .docm file. Word asks whether to enable its macros, as for any document with macros from
 * elsewhere.
 *
 * VBA keeps code in Windows-1252, the code page of Word in English and the other Western European languages, so a
 * character it doesn't have goes in a string as `ChrW`, such as `ChrW(&H4E2D)` for "中", or two for a character beyond
 * U+FFFF, such as `ChrW(&HD83D) & ChrW(&HDE00)` for "😀".
 *
 * Word compiles the code when it first runs a macro, so a mistake in it shows then, in the VBA editor.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * const doc = new Document({
 *   macros: createMacros({
 *     thisDocument: 'Private Sub Document_Open()\n    MsgBox "Hello"\nEnd Sub',
 *     modules: [{ name: "Formatting", code: "Sub MakeBold()\n    Selection.Font.Bold = True\nEnd Sub" }],
 *   }),
 *   sections: [{ children: [new Paragraph("Hello World")] }],
 * });
 * ```
 *
 * @throws If a module's name isn't a VBA name of up to 31 characters, or is taken: by another module, ignoring case, or
 * by ThisDocument, the project, Project, or a library it uses, VBA, Word, stdole, Normal or Office
 * @returns The document's macros, for its `macros`: the VBA project, and the events of the document it handles
 * @throws If code has a character Windows-1252 doesn't
 */
export const createMacros = ({ thisDocument = "", modules = [], classModules = [] }: MacrosOptions = {}): DocumentMacros & {
    readonly project: Uint8Array;
    readonly events: readonly DocumentMacroEvent[];
} => {
    const given = [
        ...modules.map((module) => ({ ...module, kind: "module" as const })),
        ...classModules.map((module) => ({ ...module, kind: "class" as const })),
    ];
    for (const [index, { name }] of given.entries()) {
        if (!NAME.test(name)) {
            throw new Error(
                `Invalid module name "${name}". Expected a letter, then letters, digits and underscores, up to 31 of them, such as "Formatting"`,
            );
        }
        const taken = [...TAKEN_NAMES, ...given.slice(0, index).map((module) => module.name)].find(
            (takenName) => takenName.toLowerCase() === name.toLowerCase(),
        );
        if (taken !== undefined) {
            throw new Error(`Invalid module name "${name}". ${taken} is already a name in the project`);
        }
    }

    const projectModules: readonly ProjectModule[] = [
        { name: "ThisDocument", kind: "document" as const, code: thisDocument },
        ...given,
    ].map(({ name, kind, code }) => {
        // VBA's lines end with CR LF, the last one too
        const lines = code.replace(/\r\n?/g, "\n").replace(/\n$/, "");
        const text = `${ATTRIBUTES[kind](name)}\r\n${lines === "" ? "" : `${lines.replace(/\n/g, "\r\n")}\r\n`}`;
        return { name, kind, source: encodeWindows1252(text, `The code of ${name}`) };
    });

    const project = createCompoundFile([
        {
            name: "VBA",
            children: [
                // The cache of the compiled project, which there is none of: VBA compiles the code again
                { name: "_VBA_PROJECT", data: Uint8Array.from([0xcc, 0x61, 0xff, 0xff, 0x00, 0x01, 0x00]) },
                { name: "dir", data: createDirStream(projectModules) },
                ...projectModules.map(({ name, source }) => ({ name, data: compress(source) })),
            ],
        },
        { name: "PROJECT", data: createProjectStream(projectModules) },
        { name: "PROJECTwm", data: createNamesStream(projectModules) },
    ]);
    return { project, events: findEvents(thisDocument) };
};

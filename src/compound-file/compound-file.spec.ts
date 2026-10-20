import { describe, expect, it } from "vitest";

import { type CompoundFileDirectoryEntry, readCompoundFile } from "tests/compound-file";

import { createCompoundFile } from "./compound-file";

const NO_STREAM = 0xffffffff;

const bytes = (length: number, value: number): Uint8Array => new Uint8Array(length).fill(value);

// The order of a storage's tree: a shorter name first, then by the names in capitals
const compareNames = (a: string, b: string): number =>
    a.length - b.length || (a.toUpperCase() < b.toUpperCase() ? -1 : a.toUpperCase() > b.toUpperCase() ? 1 : 0);

/**
 * Checks that the tree of a storage's entries, from the entry with the id, is a binary search tree in the file's order
 * and a red-black tree, returning its names in order and the number of black entries on each path down it.
 */
const checkTree = (
    entries: readonly CompoundFileDirectoryEntry[],
    id: number,
    parentRed = false,
): { readonly names: readonly string[]; readonly blackHeight: number } => {
    if (id === NO_STREAM) {
        return { names: [], blackHeight: 0 };
    }
    const entry = entries[id];
    const red = entry.color === 0;
    expect(red && parentRed, `${entry.name} is red under a red entry`).toBe(false);
    const left = checkTree(entries, entry.left, red);
    const right = checkTree(entries, entry.right, red);
    expect(left.blackHeight, `the paths down from ${entry.name} have as many black entries`).toBe(right.blackHeight);
    const names = [...left.names, entry.name, ...right.names];
    for (let index = 1; index < names.length; index++) {
        expect(compareNames(names[index - 1], names[index])).toBeLessThan(0);
    }
    return { names, blackHeight: left.blackHeight + (red ? 0 : 1) };
};

describe("createCompoundFile", () => {
    it("should write a version 3 file with 512-byte sectors and 64-byte mini sectors", () => {
        const { header } = readCompoundFile(createCompoundFile([{ name: "PROJECT", data: bytes(10, 1) }]));

        expect(header).toEqual({
            minorVersion: 0x003e,
            majorVersion: 3,
            byteOrder: 0xfffe,
            sectorShift: 9,
            miniSectorShift: 6,
            miniStreamCutoff: 4096,
        });
    });

    it("should write each stream, in its storage, to be read back", () => {
        const file = readCompoundFile(
            createCompoundFile([
                { name: "VBA", children: [{ name: "dir", data: bytes(545, 2) }] },
                { name: "PROJECT", data: bytes(64, 3) },
                { name: "PROJECTwm", data: bytes(1, 4) },
            ]),
        );

        expect(file.streams).toEqual(
            new Map([
                ["PROJECT", bytes(64, 3)],
                ["PROJECTwm", bytes(1, 4)],
                ["VBA/dir", bytes(545, 2)],
            ]),
        );
        expect(file.entries[0]).toMatchObject({ name: "Root Entry", type: 5, color: 1 });
        expect(file.entries.find((entry) => entry.name === "VBA")).toMatchObject({ type: 1, start: 0, size: 0 });
    });

    it("should write a stream of 4096 bytes or more in the file's own sectors, and a shorter one in the mini stream", () => {
        const file = readCompoundFile(
            createCompoundFile([
                { name: "Large", data: bytes(4096, 5) },
                { name: "Larger", data: bytes(10000, 6) },
                { name: "Small", data: bytes(4095, 7) },
            ]),
        );

        expect(file.streams.get("Large")).toEqual(bytes(4096, 5));
        expect(file.streams.get("Larger")).toEqual(bytes(10000, 6));
        expect(file.streams.get("Small")).toEqual(bytes(4095, 7));
        // The root's stream is the mini stream, which only the small stream is in
        expect(file.entries[0].size).toBe(4096);
    });

    it("should write a file without a mini stream when every stream is large", () => {
        const file = readCompoundFile(createCompoundFile([{ name: "Large", data: bytes(5000, 8) }]));

        expect(file.streams.get("Large")).toEqual(bytes(5000, 8));
        expect(file.entries[0]).toMatchObject({ start: 0xfffffffe, size: 0 });
    });

    it("should link each storage's entries into a red-black tree in the file's order", () => {
        // Names of different lengths and cases, in no order, so the tree has to sort them
        const names = ["_VBA_PROJECT", "dir", "ThisDocument", "Module1", "a", "B", "Counter", "Formatting", "__SRP_0", "Zeta", "x1"];
        const file = readCompoundFile(
            createCompoundFile([{ name: "VBA", children: names.map((name, index) => ({ name, data: bytes(index + 1, index) })) }]),
        );
        const vba = file.entries.find((entry) => entry.name === "VBA")!;
        const tree = checkTree(file.entries, vba.child);

        expect(tree.names).toEqual([...names].sort(compareNames));
        expect(file.entries[vba.child].color).toBe(1);
        for (const [index, name] of names.entries()) {
            expect(file.streams.get(`VBA/${name}`)).toEqual(bytes(index + 1, index));
        }
    });

    it("should write a directory and a FAT of more than one sector each", () => {
        const children = Array.from({ length: 40 }, (_, index) => ({ name: `Stream${index}`, data: bytes(4096 + index, index) }));
        const file = readCompoundFile(createCompoundFile(children));

        expect(file.streams.size).toBe(40);
        for (const [index, { name }] of children.entries()) {
            expect(file.streams.get(name)).toEqual(bytes(4096 + index, index));
        }
        checkTree(file.entries, file.entries[0].child);
    });

    it("should write an empty storage", () => {
        const file = readCompoundFile(createCompoundFile([{ name: "VBA", children: [] }]));

        expect(file.streams.size).toBe(0);
        expect(file.entries.find((entry) => entry.name === "VBA")).toMatchObject({ type: 1, child: NO_STREAM });
    });

    it("should list the FAT's sectors after the first 109 in DIFAT sectors, for a file of more than about 7 MB", () => {
        // 109 sectors of the FAT, of 128 sector numbers each, are 109 × 128 sectors of 512 bytes, and this stream needs
        // 128 × 127 more, so the FAT has more than the 109 + 127 sectors one DIFAT sector lists
        const data = new Uint8Array((109 + 128) * 128 * 512).map((_, index) => index % 251);
        const compoundFile = createCompoundFile([
            { name: "Large", data },
            { name: "Small", data: bytes(10, 1) },
        ]);
        const view = new DataView(compoundFile.buffer);
        const file = readCompoundFile(compoundFile);

        // Two DIFAT sectors, the second ending the chain
        expect(view.getUint32(72, true)).toBe(2);
        const second = view.getUint32(512 + view.getUint32(68, true) * 512 + 127 * 4, true);
        expect(view.getUint32(512 + second * 512 + 127 * 4, true)).toBe(0xfffffffe);
        // Compared by hand, as comparing 15 MB with toEqual takes half a minute
        const large = file.streams.get("Large")!;
        expect(large.length).toBe(data.length);
        expect(large.findIndex((byte, index) => byte !== data[index])).toBe(-1);
        expect(file.streams.get("Small")).toEqual(bytes(10, 1));
    });

    it("should give the root the class id, and none without one", () => {
        const withClassId = readCompoundFile(
            createCompoundFile([{ name: "Data", data: bytes(1, 0) }], { classId: "0003000c-0000-0000-c000-000000000046" }),
        );
        const without = readCompoundFile(createCompoundFile([{ name: "Data", data: bytes(1, 0) }]));

        expect(withClassId.entries[0].classId).toBe("0003000C-0000-0000-C000-000000000046");
        expect(without.entries[0].classId).toBeUndefined();
    });

    it("should throw for a class id that isn't a GUID", () => {
        expect(() => createCompoundFile([], { classId: "{0003000C-0000-0000-C000-000000000046}" })).toThrow(
            'Invalid class id "{0003000C-0000-0000-C000-000000000046}". Expected a GUID such as "0003000C-0000-0000-C000-000000000046"',
        );
    });

    it("should throw for two entries of a storage with the same name, ignoring case", () => {
        expect(() =>
            createCompoundFile([
                { name: "Module1", data: bytes(1, 0) },
                { name: "MODULE1", data: bytes(1, 0) },
            ]),
        ).toThrow('Two compound file entries in a storage are named "MODULE1"');
    });

    it.each(["", "a".repeat(32), "a/b", "a\\b", "a:b", "a!b"])("should throw for the name %j", (name) => {
        expect(() => createCompoundFile([{ name, data: bytes(1, 0) }])).toThrow(`Invalid compound file entry name "${name}"`);
    });
});

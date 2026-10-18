/**
 * Writes a compound file, the format a VBA project is kept in: a file system in a file, with storages, its folders, and
 * streams, its files.
 *
 * Reference: [MS-CFB] Compound File Binary File Format
 *
 * @module
 */

/**
 * A stream of a compound file: a file in it.
 */
export type CompoundFileStream = {
    readonly name: string;
    readonly data: Uint8Array;
};

/**
 * A storage of a compound file: a folder in it.
 */
export type CompoundFileStorage = {
    readonly name: string;
    readonly children: readonly CompoundFileEntry[];
};

export type CompoundFileEntry = CompoundFileStream | CompoundFileStorage;

// Version 3 files have 512-byte sectors. Streams shorter than 4096 bytes are kept in the mini stream instead, in 64-byte
// mini sectors, which the root's stream holds
const SECTOR_SIZE = 512;
const MINI_SECTOR_SIZE = 64;
const MINI_STREAM_CUTOFF = 4096;
const DIRECTORY_ENTRY_SIZE = 128;
// The number of sector numbers a sector of the FAT holds, and the number of FAT sectors the header lists
const SECTOR_NUMBERS_PER_SECTOR = SECTOR_SIZE / 4;
const HEADER_FAT_SECTORS = 109;

const FREE_SECTOR = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;
const FAT_SECTOR = 0xfffffffd;
const NO_STREAM = 0xffffffff;

const STORAGE = 1;
const STREAM = 2;
const ROOT_STORAGE = 5;
const RED = 0;
const BLACK = 1;

type DirectoryEntry = {
    readonly name: string;
    readonly type: typeof STORAGE | typeof STREAM | typeof ROOT_STORAGE;
    readonly data?: Uint8Array;
    // eslint-disable-next-line functional/prefer-readonly-type
    left: number;
    // eslint-disable-next-line functional/prefer-readonly-type
    right: number;
    // eslint-disable-next-line functional/prefer-readonly-type
    child: number;
    // eslint-disable-next-line functional/prefer-readonly-type
    color: typeof RED | typeof BLACK;
    // eslint-disable-next-line functional/prefer-readonly-type
    start: number;
    // eslint-disable-next-line functional/prefer-readonly-type
    size: number;
};

/**
 * Orders the entries of a storage as the file's red-black trees do: a shorter name first, then by the names in capitals.
 */
const compareNames = (a: string, b: string): number => {
    if (a.length !== b.length) {
        return a.length - b.length;
    }
    const upperA = a.toUpperCase();
    const upperB = b.toUpperCase();
    return upperA < upperB ? -1 : upperA > upperB ? 1 : 0;
};

/**
 * Links a storage's entries, in order, into a balanced tree that is a valid red-black tree: the entries on its deepest
 * level are red, and the rest black.
 *
 * @returns The id of the tree's root
 */
const linkTree = (entries: readonly DirectoryEntry[], ids: readonly number[]): number => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const depths: number[] = [];
    const link = (from: number, to: number, depth: number): number => {
        if (from > to) {
            return NO_STREAM;
        }
        const middle = Math.floor((from + to) / 2);
        const entry = entries[ids[middle]];
        // eslint-disable-next-line functional/immutable-data
        depths[middle] = depth;
        // eslint-disable-next-line functional/immutable-data
        entry.left = link(from, middle - 1, depth + 1);
        // eslint-disable-next-line functional/immutable-data
        entry.right = link(middle + 1, to, depth + 1);
        return ids[middle];
    };
    const root = link(0, ids.length - 1, 0);
    const deepest = Math.max(...depths);
    for (const [index, id] of ids.entries()) {
        // eslint-disable-next-line functional/immutable-data
        entries[id].color = depths[index] === deepest && deepest > 0 ? RED : BLACK;
    }
    return root;
};

/**
 * The directory's entries, the root first, with each storage's entries linked into its tree.
 */
const createDirectory = (children: readonly CompoundFileEntry[]): readonly DirectoryEntry[] => {
    const entry = (name: string, type: DirectoryEntry["type"], data?: Uint8Array): DirectoryEntry => {
        // A name has at most 31 UTF-16 code units, and none of "/", "\", ":" and "!"
        if (name.length === 0 || name.length > 31 || /[/\\:!]/.test(name)) {
            throw new Error(`Invalid compound file entry name "${name}"`);
        }
        return { name, type, data, left: NO_STREAM, right: NO_STREAM, child: NO_STREAM, color: BLACK, start: 0, size: 0 };
    };
    // eslint-disable-next-line functional/prefer-readonly-type
    const entries: DirectoryEntry[] = [entry("Root Entry", ROOT_STORAGE)];
    const addChildren = (parent: DirectoryEntry, storageChildren: readonly CompoundFileEntry[]): void => {
        const sorted = [...storageChildren].sort((a, b) => compareNames(a.name, b.name));
        for (const [index, child] of sorted.entries()) {
            if (index > 0 && compareNames(sorted[index - 1].name, child.name) === 0) {
                throw new Error(`Two compound file entries in a storage are named "${child.name}"`);
            }
        }
        const ids = sorted.map((child) => {
            // eslint-disable-next-line functional/immutable-data
            entries.push("children" in child ? entry(child.name, STORAGE) : entry(child.name, STREAM, child.data));
            return entries.length - 1;
        });
        // eslint-disable-next-line functional/immutable-data
        parent.child = ids.length === 0 ? NO_STREAM : linkTree(entries, ids);
        for (const [index, child] of sorted.entries()) {
            if ("children" in child) {
                addChildren(entries[ids[index]], child.children);
            }
        }
    };
    addChildren(entries[0], children);
    return entries;
};

/**
 * Lays out a chain of sectors, each pointing to the next, in a table of sector numbers, such as the FAT.
 *
 * @returns The chain's first sector, or END_OF_CHAIN for none
 */
// eslint-disable-next-line functional/prefer-readonly-type
const addChain = (table: number[], count: number, value?: number): number => {
    if (count === 0) {
        return END_OF_CHAIN;
    }
    const start = table.length;
    for (let index = 0; index < count; index++) {
        // eslint-disable-next-line functional/immutable-data
        table.push(value ?? (index === count - 1 ? END_OF_CHAIN : start + index + 1));
    }
    return start;
};

/**
 * Writes a compound file of version 3, as Office writes VBA projects.
 *
 * @param children - The root storage's streams and storages
 * @throws If two entries of a storage have the same name, ignoring case, or a name is empty, longer than 31 characters or
 * has "/", "\", ":" or "!"
 */
export const createCompoundFile = (children: readonly CompoundFileEntry[]): Uint8Array => {
    const entries = createDirectory(children);
    const streams = entries.filter((entry) => entry.type === STREAM);
    const miniStreams = streams.filter((entry) => entry.data!.length < MINI_STREAM_CUTOFF);
    const largeStreams = streams.filter((entry) => entry.data!.length >= MINI_STREAM_CUTOFF);

    // The mini stream, with its own table of mini sectors, the mini FAT
    // eslint-disable-next-line functional/prefer-readonly-type
    const miniFat: number[] = [];
    for (const stream of miniStreams) {
        // eslint-disable-next-line functional/immutable-data
        stream.start = addChain(miniFat, Math.ceil(stream.data!.length / MINI_SECTOR_SIZE));
        // eslint-disable-next-line functional/immutable-data
        stream.size = stream.data!.length;
    }
    const miniStreamSize = miniFat.length * MINI_SECTOR_SIZE;

    // The sectors: the directory, the mini FAT, the mini stream, the large streams, then the FAT, which counts itself
    // eslint-disable-next-line functional/prefer-readonly-type
    const fat: number[] = [];
    const directoryStart = addChain(fat, Math.ceil(entries.length / (SECTOR_SIZE / DIRECTORY_ENTRY_SIZE)));
    const miniFatSectors = Math.ceil(miniFat.length / SECTOR_NUMBERS_PER_SECTOR);
    const miniFatStart = addChain(fat, miniFatSectors);
    // eslint-disable-next-line functional/immutable-data
    entries[0].start = addChain(fat, Math.ceil(miniStreamSize / SECTOR_SIZE));
    // eslint-disable-next-line functional/immutable-data
    entries[0].size = miniStreamSize;
    for (const stream of largeStreams) {
        // eslint-disable-next-line functional/immutable-data
        stream.start = addChain(fat, Math.ceil(stream.data!.length / SECTOR_SIZE));
        // eslint-disable-next-line functional/immutable-data
        stream.size = stream.data!.length;
    }
    let fatSectors = 0;
    while (fatSectors * SECTOR_NUMBERS_PER_SECTOR < fat.length + fatSectors) {
        fatSectors++;
    }
    if (fatSectors > HEADER_FAT_SECTORS) {
        throw new Error(
            `A compound file of more than ${HEADER_FAT_SECTORS * SECTOR_NUMBERS_PER_SECTOR * SECTOR_SIZE} bytes isn't supported`,
        );
    }
    const fatStart = addChain(fat, fatSectors, FAT_SECTOR);

    const file = new Uint8Array(SECTOR_SIZE + fat.length * SECTOR_SIZE);
    const view = new DataView(file.buffer);
    const sectorOffset = (sector: number): number => SECTOR_SIZE + sector * SECTOR_SIZE;

    // The header
    file.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    view.setUint16(24, 0x003e, true);
    view.setUint16(26, 0x0003, true);
    view.setUint16(28, 0xfffe, true);
    view.setUint16(30, 9, true);
    view.setUint16(32, 6, true);
    view.setUint32(44, fatSectors, true);
    view.setUint32(48, directoryStart, true);
    view.setUint32(56, MINI_STREAM_CUTOFF, true);
    view.setUint32(60, miniFatStart, true);
    view.setUint32(64, miniFatSectors, true);
    view.setUint32(68, END_OF_CHAIN, true);
    for (let index = 0; index < HEADER_FAT_SECTORS; index++) {
        view.setUint32(76 + index * 4, index < fatSectors ? fatStart + index : FREE_SECTOR, true);
    }

    // The directory. Its unused entries are zeros, but for their links
    for (let index = 0; index < Math.ceil(entries.length / 4) * 4; index++) {
        const offset = sectorOffset(directoryStart) + index * DIRECTORY_ENTRY_SIZE;
        const entry = entries[index];
        if (entry === undefined) {
            view.setUint32(offset + 68, NO_STREAM, true);
            view.setUint32(offset + 72, NO_STREAM, true);
            view.setUint32(offset + 76, NO_STREAM, true);
            continue;
        }
        for (let position = 0; position < entry.name.length; position++) {
            view.setUint16(offset + position * 2, entry.name.charCodeAt(position), true);
        }
        view.setUint16(offset + 64, (entry.name.length + 1) * 2, true);
        view.setUint8(offset + 66, entry.type);
        view.setUint8(offset + 67, entry.color);
        view.setUint32(offset + 68, entry.left, true);
        view.setUint32(offset + 72, entry.right, true);
        view.setUint32(offset + 76, entry.child, true);
        view.setUint32(offset + 116, entry.type === STORAGE ? 0 : entry.start, true);
        view.setUint32(offset + 120, entry.size, true);
    }

    // The mini FAT, with its unused sector numbers free
    for (let index = 0; index < miniFatSectors * SECTOR_NUMBERS_PER_SECTOR; index++) {
        view.setUint32(sectorOffset(miniFatStart) + index * 4, miniFat[index] ?? FREE_SECTOR, true);
    }

    // The mini stream, then the large streams
    for (const stream of miniStreams) {
        file.set(stream.data!, sectorOffset(entries[0].start) + stream.start * MINI_SECTOR_SIZE);
    }
    for (const stream of largeStreams) {
        file.set(stream.data!, sectorOffset(stream.start));
    }

    // The FAT, with its unused sector numbers free
    for (let index = 0; index < fatSectors * SECTOR_NUMBERS_PER_SECTOR; index++) {
        view.setUint32(sectorOffset(fatStart) + index * 4, fat[index] ?? FREE_SECTOR, true);
    }

    return file;
};

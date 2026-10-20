/**
 * Helpers for tests of the compound files docx writes, for docx/macros' VBA projects and docx/embedded-files' OLE
 * objects: they read them back as Office does, from the specification rather than from docx's own code.
 */
/* eslint-disable no-bitwise -- the sizes of sectors are powers of two */

/**
 * An entry of a compound file's directory, as written.
 */
export type CompoundFileDirectoryEntry = {
    readonly name: string;
    /** 1 for a storage, 2 for a stream and 5 for the root. 0 is an unused entry */
    readonly type: number;
    /** 0 for red and 1 for black */
    readonly color: number;
    readonly left: number;
    readonly right: number;
    readonly child: number;
    readonly start: number;
    readonly size: number;
    /** The class id of a storage or the root, such as "0003000C-0000-0000-C000-000000000046", or undefined for none */
    readonly classId?: string;
};

/**
 * A compound file, as read: its header's fields, its directory, and each stream, by its path, such as "VBA/dir".
 */
export type ReadCompoundFile = {
    readonly header: {
        readonly minorVersion: number;
        readonly majorVersion: number;
        readonly byteOrder: number;
        readonly sectorShift: number;
        readonly miniSectorShift: number;
        readonly miniStreamCutoff: number;
    };
    readonly entries: readonly CompoundFileDirectoryEntry[];
    readonly streams: ReadonlyMap<string, Uint8Array>;
};

const END_OF_CHAIN = 0xfffffffe;

const hex = (bytes: readonly number[]): string =>
    bytes
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

/**
 * A class id as written in a directory entry, a GUID whose first three fields are little-endian, in its usual form.
 */
const classIdOf = (bytes: Uint8Array): string | undefined => {
    if (bytes.every((byte) => byte === 0)) {
        return undefined;
    }
    const [a, b, c, d] = [
        [...bytes.subarray(0, 4)].reverse(),
        [...bytes.subarray(4, 6)].reverse(),
        [...bytes.subarray(6, 8)].reverse(),
        [...bytes.subarray(8)],
    ];
    return `${hex(a)}-${hex(b)}-${hex(c)}-${hex(d.slice(0, 2))}-${hex(d.slice(2))}`;
};
const NO_STREAM = 0xffffffff;

/**
 * Reads a compound file of version 3, following its FAT, its directory and its mini stream.
 *
 * Reference: [MS-CFB] Compound File Binary File Format
 */
export const readCompoundFile = (file: Uint8Array): ReadCompoundFile => {
    const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
    const sectorSize = 1 << view.getUint16(30, true);
    const miniSectorSize = 1 << view.getUint16(32, true);
    const miniStreamCutoff = view.getUint32(56, true);
    const sectorOffset = (sector: number): number => (sector + 1) * sectorSize;

    // The FAT's sectors: the first 109 are listed in the header, and the rest in a chain of DIFAT sectors, each listing
    // as many as it has room for after the number of the next
    const fatSectorCount = view.getUint32(44, true);
    // eslint-disable-next-line functional/prefer-readonly-type
    const fatSectors: number[] = [];
    for (let index = 0; index < Math.min(fatSectorCount, 109); index++) {
        // eslint-disable-next-line functional/immutable-data
        fatSectors.push(view.getUint32(76 + index * 4, true));
    }
    const perDifatSector = sectorSize / 4 - 1;
    for (let sector = view.getUint32(68, true), count = 0; count < view.getUint32(72, true); count++) {
        for (let index = 0; index < perDifatSector && fatSectors.length < fatSectorCount; index++) {
            // eslint-disable-next-line functional/immutable-data
            fatSectors.push(view.getUint32(sectorOffset(sector) + index * 4, true));
        }
        sector = view.getUint32(sectorOffset(sector) + perDifatSector * 4, true);
    }
    const fat = fatSectors.flatMap((sector) =>
        Array.from({ length: sectorSize / 4 }, (_, index) => view.getUint32(sectorOffset(sector) + index * 4, true)),
    );
    const chain = (table: readonly number[], start: number): readonly number[] => {
        // eslint-disable-next-line functional/prefer-readonly-type
        const sectors: number[] = [];
        // No longer than the table, so a chain that loops ends
        for (let sector = start; sector !== END_OF_CHAIN && sectors.length < table.length; sector = table[sector]) {
            // eslint-disable-next-line functional/immutable-data
            sectors.push(sector);
        }
        return sectors;
    };
    const readChain = (start: number): Uint8Array => {
        const sectors = chain(fat, start);
        const bytes = new Uint8Array(sectors.length * sectorSize);
        for (const [index, sector] of sectors.entries()) {
            bytes.set(file.subarray(sectorOffset(sector), sectorOffset(sector) + sectorSize), index * sectorSize);
        }
        return bytes;
    };

    const directory = readChain(view.getUint32(48, true));
    const directoryView = new DataView(directory.buffer);
    const entries = Array.from({ length: directory.length / 128 }, (_, index): CompoundFileDirectoryEntry => {
        const offset = index * 128;
        const nameLength = directoryView.getUint16(offset + 64, true);
        const name = String.fromCharCode(
            ...Array.from({ length: Math.max(nameLength / 2 - 1, 0) }, (__, position) =>
                directoryView.getUint16(offset + position * 2, true),
            ),
        );
        return {
            name,
            type: directory[offset + 66],
            color: directory[offset + 67],
            left: directoryView.getUint32(offset + 68, true),
            right: directoryView.getUint32(offset + 72, true),
            child: directoryView.getUint32(offset + 76, true),
            start: directoryView.getUint32(offset + 116, true),
            size: directoryView.getUint32(offset + 120, true),
            classId: classIdOf(directory.subarray(offset + 80, offset + 96)),
        };
    });

    const miniFatStart = view.getUint32(60, true);
    const miniFatBytes = miniFatStart === END_OF_CHAIN ? new Uint8Array() : readChain(miniFatStart);
    const miniFat = Array.from({ length: miniFatBytes.length / 4 }, (_, index) =>
        new DataView(miniFatBytes.buffer).getUint32(index * 4, true),
    );
    const miniStream = entries[0].start === END_OF_CHAIN ? new Uint8Array() : readChain(entries[0].start);

    const readStream = (entry: CompoundFileDirectoryEntry): Uint8Array => {
        if (entry.size >= miniStreamCutoff) {
            return readChain(entry.start).subarray(0, entry.size);
        }
        const bytes = new Uint8Array(entry.size);
        for (const [index, sector] of chain(miniFat, entry.start).entries()) {
            const part = miniStream.subarray(sector * miniSectorSize, (sector + 1) * miniSectorSize);
            bytes.set(part.subarray(0, Math.min(miniSectorSize, entry.size - index * miniSectorSize)), index * miniSectorSize);
        }
        return bytes;
    };

    // Each storage's entries are a tree, read in order
    const streams = new Map<string, Uint8Array>();
    const walk = (id: number, folder: string): void => {
        if (id === NO_STREAM) {
            return;
        }
        const entry = entries[id];
        walk(entry.left, folder);
        if (entry.type === 1) {
            walk(entry.child, `${folder}${entry.name}/`);
        } else {
            // eslint-disable-next-line functional/immutable-data
            streams.set(`${folder}${entry.name}`, readStream(entry));
        }
        walk(entry.right, folder);
    };
    walk(entries[0].child, "");

    return {
        header: {
            minorVersion: view.getUint16(24, true),
            majorVersion: view.getUint16(26, true),
            byteOrder: view.getUint16(28, true),
            sectorShift: view.getUint16(30, true),
            miniSectorShift: view.getUint16(32, true),
            miniStreamCutoff,
        },
        entries,
        streams,
    };
};

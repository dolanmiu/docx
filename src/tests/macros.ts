/**
 * Helpers for tests of docx/macros: they read the VBA projects it writes back, as Word does, from the specifications
 * rather than from docx/macros' own code.
 */
/* eslint-disable no-bitwise -- the formats are bit fields */

/**
 * Decompresses data VBA compressed.
 *
 * Reference: [MS-OVBA] 2.4.1.3.1 Decompression Algorithm
 */
export const decompress = (data: Uint8Array): Uint8Array => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const output: number[] = [];
    // After the signature byte, 0x01
    let chunkStart = 1;
    while (chunkStart < data.length) {
        const header = data[chunkStart] | (data[chunkStart + 1] << 8);
        const chunkEnd = Math.min(data.length, chunkStart + (header & 0x0fff) + 3);
        const decompressedStart = output.length;
        let current = chunkStart + 2;
        if ((header & 0x8000) === 0) {
            // eslint-disable-next-line functional/immutable-data
            output.push(...data.subarray(current, current + 4096));
        } else {
            while (current < chunkEnd) {
                const flags = data[current++];
                for (let index = 0; index < 8 && current < chunkEnd; index++) {
                    if ((flags & (1 << index)) === 0) {
                        // eslint-disable-next-line functional/immutable-data
                        output.push(data[current++]);
                        continue;
                    }
                    const token = data[current] | (data[current + 1] << 8);
                    current += 2;
                    const difference = output.length - decompressedStart;
                    const bitCount = Math.max(Math.ceil(Math.log2(difference)), 4);
                    const length = (token & (0xffff >> bitCount)) + 3;
                    const offset = (token >> (16 - bitCount)) + 1;
                    for (let copied = 0; copied < length; copied++) {
                        // eslint-disable-next-line functional/immutable-data
                        output.push(output[output.length - offset]);
                    }
                }
            }
        }
        chunkStart = chunkEnd;
    }
    return Uint8Array.from(output);
};

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

    const fatSectors = Array.from({ length: view.getUint32(44, true) }, (_, index) => view.getUint32(76 + index * 4, true));
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

// Twip - twentieths of a point
export const convertMillimetersToTwip = (millimeters: number): number => Math.floor((millimeters / 25.4) * 72 * 20);

export const convertInchesToTwip = (inches: number): number => Math.floor(inches * 72 * 20);

export type UniqueNumericIdCreator = () => number;

export const uniqueNumericIdCreator = (initial = 0): UniqueNumericIdCreator => {
    let currentCount = initial;

    return () => ++currentCount;
};

export const abstractNumUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator();

// Setting initial to 1 as we have numId = 1 for "default-bullet-numbering"
export const concreteNumUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator(1);

export const docPropertiesUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator();

export const bookmarkUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator();

export const uniqueId = (): string => crypto.randomUUID();

// FNV-1a 32-bit hash + byte length suffix for internal deduplication.
// Appending the length means a collision requires both the same hash AND the same size,
// sufficiently low collision risk for internal, non-adversarial deduplication.
export const hashedId = (data: Buffer | string | Uint8Array | ArrayBuffer): string => {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof ArrayBuffer ? new Uint8Array(data) : data;

    /* eslint-disable @typescript-eslint/prefer-for-of, no-bitwise -- performance hash function */
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
        h ^= bytes[i];
        h = Math.imul(h, 0x01000193);
    }

    return `${(h >>> 0).toString(16).padStart(8, "0")}-${bytes.length}`;
    /* eslint-enable @typescript-eslint/prefer-for-of, no-bitwise */
};

export const uniqueUuid = (): string => crypto.randomUUID();

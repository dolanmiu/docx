import hash from "hash.js";
import { customAlphabet, nanoid } from "nanoid/non-secure";

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

export const uniqueId = (): string => nanoid().toLowerCase();

export const hashedId = (data: Buffer | string | Uint8Array | ArrayBuffer): string =>
    hash
        .sha1()
        .update(data instanceof ArrayBuffer ? new Uint8Array(data) : data)
        .digest("hex");

const generateUuidPart = (count: number): string => customAlphabet("1234567890abcdef", count)();
export const uniqueUuid = (): string =>
    `${generateUuidPart(8)}-${generateUuidPart(4)}-${generateUuidPart(4)}-${generateUuidPart(4)}-${generateUuidPart(12)}`;

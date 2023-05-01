import { nanoid } from "nanoid/non-secure";

// Twip - twentieths of a point
export const convertMillimetersToTwip = (millimeters: number): number => Math.floor((millimeters / 25.4) * 72 * 20);

export const convertInchesToTwip = (inches: number): number => Math.floor(inches * 72 * 20);

export const uniqueNumericIdCreator = (initial = 0): (() => number) => {
    let currentCount = initial;

    return () => ++currentCount;
};

export const abstractNumUniqueNumericId = uniqueNumericIdCreator();
export const concreteNumUniqueNumericId = uniqueNumericIdCreator(1); // Setting initial to 1 as we have numId = 1 for "default-bullet-numbering"
export const docPropertiesUniqueNumericId = uniqueNumericIdCreator();
export const bookmarkUniqueNumericId = uniqueNumericIdCreator();

export const uniqueId = (): string => nanoid().toLowerCase();

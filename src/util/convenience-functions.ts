import { nanoid } from "nanoid/non-secure";

// Twip - twentieths of a point
export const convertMillimetersToTwip = (millimeters: number): number => Math.floor((millimeters / 25.4) * 72 * 20);

export const convertInchesToTwip = (inches: number): number => Math.floor(inches * 72 * 20);

export const uniqueNumericIdCreator = (initial = 0): (() => number) => {
    let currentCount = initial;

    return () => ++currentCount;
};

export const uniqueId = (): string => nanoid().toLowerCase();

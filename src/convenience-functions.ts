import { customAlphabet, nanoid } from "nanoid/non-secure";

const numericNanoId = customAlphabet("0123456789", 15);

// Twip - twentieths of a point
export const convertMillimetersToTwip = (millimeters: number): number => {
    return Math.floor((millimeters / 25.4) * 72 * 20);
};

export const convertInchesToTwip = (inches: number): number => {
    return Math.floor(inches * 72 * 20);
};

export const uniqueNumericId = (): number => {
    return parseFloat(numericNanoId());
};

export const uniqueId = (): string => {
    return nanoid().toLowerCase();
};

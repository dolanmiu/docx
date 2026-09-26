/**
 * Categories in groups, such as quarters in years: how many there are, and the rows of labels they are laid out in.
 *
 * @module
 */
import type { ChartCategoryGroup } from "./chart-options";

/**
 * A chart's categories: plain categories, or groups of them.
 */
export type ChartCategories = readonly (string | number | Date)[] | readonly ChartCategoryGroup[];

/**
 * A row of the sheet's category columns: the labels of a category and of the groups it is in, from the outermost group
 * in. A group's name is in the row of its first category only, as Excel lays out groups.
 */
export type CategoryRow = readonly (string | number | undefined)[];

const isGroup = (category: unknown): category is ChartCategoryGroup =>
    typeof category === "object" && category !== null && !(category instanceof Date);

/**
 * Whether the categories are groups of categories.
 */
export const isCategoryGroups = (categories: ChartCategories): categories is readonly ChartCategoryGroup[] =>
    categories.length > 0 && isGroup(categories[0]);

/**
 * The rows of labels grouped categories are laid out in, one for each category, from the outermost group in.
 */
export const categoryRowsOf = (groups: readonly ChartCategoryGroup[]): readonly CategoryRow[] =>
    groups.flatMap(({ name, categories }) => {
        const rows: readonly CategoryRow[] = isCategoryGroups(categories) ? categoryRowsOf(categories) : categories.map((one) => [one]);
        return rows.map((row, index) => [index === 0 ? name : undefined, ...row]);
    });

/**
 * The categories along the axis, without their groups: the categories of the innermost groups, in order.
 */
export const leafCategoriesOf = (categories: ChartCategories): readonly (string | number | Date)[] =>
    isCategoryGroups(categories) ? categoryRowsOf(categories).map((row) => row[row.length - 1]!) : categories;

/**
 * Each category's label with its groups', from the outermost in, such as "2025 Q1", as a screen reader reads it.
 */
export const groupedCategoryLabelsOf = (groups: readonly ChartCategoryGroup[]): readonly string[] =>
    groups.flatMap(({ name, categories }) =>
        (isCategoryGroups(categories) ? groupedCategoryLabelsOf(categories) : categories.map(String)).map((label) => `${name} ${label}`),
    );

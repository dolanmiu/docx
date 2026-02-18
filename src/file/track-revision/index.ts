/**
 * Track Revision module for WordprocessingML documents.
 *
 * Provides components for tracking changes in documents including insertions,
 * deletions, and their associated metadata (author, date, id).
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @module
 */
export * from "./track-revision-components/inserted-text-run";
export * from "./track-revision-components/deleted-text-run";
export * from "./track-revision-components/inserted-table-row";
export * from "./track-revision-components/deleted-table-row";
export * from "./track-revision-components/inserted-table-cell";
export * from "./track-revision-components/deleted-table-cell";
export * from "./track-revision-components/cell-merge";

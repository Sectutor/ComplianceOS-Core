
import { Document, AlignmentType, HeadingLevel, BorderStyle, UnderlineType } from "docx";

// Brand Colors
const BRAND_PRIMARY = "1C4D8D"; // Deep Blue
const BRAND_SECONDARY = "5B9BD5"; // Lighter Blue
const TEXT_DARK = "333333";
const TEXT_LIGHT = "666666";
const BORDER_COLOR = "E0E0E0";

export const getBcpStyles = () => ({
    default: {
        heading1: {
            run: {
                font: "Calibri Light",
                size: 32, // 16pt
                color: BRAND_PRIMARY,
                bold: true,
            },
            paragraph: {
                spacing: { before: 240, after: 120 },
                border: {
                    bottom: { color: BORDER_COLOR, space: 1, style: BorderStyle.SINGLE, size: 6 }
                }
            },
        },
        heading2: {
            run: {
                font: "Calibri Light",
                size: 26, // 13pt
                color: BRAND_SECONDARY,
                bold: true,
            },
            paragraph: {
                spacing: { before: 240, after: 120 },
            },
        },
        heading3: {
            run: {
                font: "Calibri",
                size: 24, // 12pt
                color: TEXT_DARK,
                bold: true,
            },
            paragraph: {
                spacing: { before: 200, after: 100 },
            },
        },
        heading4: {
            run: {
                font: "Calibri",
                size: 22, // 11pt
                color: TEXT_DARK,
                bold: true,
                italics: true,
            },
            paragraph: {
                spacing: { before: 200, after: 100 },
            },
        },
        paragraph: {
            run: {
                font: "Calibri",
                size: 22, // 11pt
                color: TEXT_DARK,
            },
            paragraph: {
                spacing: { after: 120 }, // 6pt after
                alignment: AlignmentType.JUSTIFIED,
            },
        },
        listParagraph: {
            run: {
                font: "Calibri",
                size: 22,
                color: TEXT_DARK,
            },
            paragraph: {
                spacing: { after: 120 },
            },
        }
    },
    // Custom Paragraph Styles
    paragraphStyles: [
        {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Calibri",
                size: 22,
                color: TEXT_DARK,
            },
            paragraph: {
                spacing: { after: 120 },
                alignment: AlignmentType.LEFT,
            },
        },
        {
            id: "TableHeader",
            name: "Table Header",
            basedOn: "Normal",
            next: "Normal",
            run: {
                font: "Calibri",
                size: 22,
                bold: true,
                color: "FFFFFF",
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
            },
        },
        {
            id: "TableCell",
            name: "Table Cell",
            basedOn: "Normal",
            next: "Normal",
            run: {
                font: "Calibri",
                size: 22,
                color: TEXT_DARK,
            },
            paragraph: {
                alignment: AlignmentType.LEFT,
                spacing: { before: 60, after: 60 },
            },
        },
        {
            id: "CoverTitle",
            name: "Cover Title",
            basedOn: "Normal",
            next: "Normal",
            run: {
                font: "Calibri Light",
                size: 64, // 32pt
                bold: true,
                color: BRAND_PRIMARY,
            },
            paragraph: {
                alignment: AlignmentType.RIGHT,
                spacing: { after: 480 },
            },
        },
        {
            id: "CoverSubtitle",
            name: "Cover Subtitle",
            basedOn: "Normal",
            next: "Normal",
            run: {
                font: "Calibri",
                size: 32, // 16pt
                color: TEXT_LIGHT,
            },
            paragraph: {
                alignment: AlignmentType.RIGHT,
                spacing: { after: 240 },
            },
        }
    ],
});

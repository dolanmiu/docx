-- Reads where Word lays out each paragraph of word-split-rows-and-boxes.docx, open in Word as its active document: its text,
-- its page and how far down it it starts, in points from the top of the page, a line each, separated by tabs.
--
-- Usage: osascript scripts/layout-probes/word-split-rows-and-boxes.applescript > word-split-rows-and-boxes.tsv
on run argv
    set out to ""
    tell application "Microsoft Word"
        set d to active document
        set n to count of paragraphs of d
        repeat with i from 1 to n
            set r to text object of paragraph i of d
            set t to content of r
            if length of t > 1 then set t to text 1 thru -2 of t
            set pg to get range information r information type active end adjusted page number
            set rs to create range d start (start of content of r) end (start of content of r)
            set y to get range information rs information type vertical position relative to page
            set out to out & t & tab & pg & tab & y & linefeed
        end repeat
    end tell
    return out
end run

/**
 * Add leading zeros until we have at least as many digits as specified.
 *
 * @param num Number to format.
 * @param numDigits Number of digits to display at a minimum.
 */
function leadingZeros(num: number, numDigits: number) {
    let numString = num.toString();
    while (numString.length < numDigits) numString = "0" + numString;
    return numString;
}

/**
 * Format the date into the format used by this application
 * for presentation to the user (YYYY.MM.DD).
 * @param date Date to format.
 */
export function formatDate(date: Date): string {
    return `${date.getFullYear()}.${leadingZeros(date.getMonth(), 2)}.${leadingZeros(date.getDay(), 2)}`;
}

/**
 * Format the time into the format used by this application
 * for presentation to the user (HH:MMa).
 *
 * @param date Date to format.
 */
export function formatTime(date: Date): string {
    let hours = date.getHours();
    let meridiem = 'a';

    if (hours >= 12) {
        meridiem = 'p';
        hours -= 12;
    }

    return `${leadingZeros(hours, 2)}:${leadingZeros(date.getMinutes(), 2)}${meridiem}`;
}

/**
 * Format the date/time into the format used by this application
 * for presentation to the user (YYYY.MM.DD HH:MMa).
 *
 * @param date Date to format.
 */
export function formatDateTime(date: Date): string {
    return `${formatDate(date)} ${formatTime(date)}`;
}
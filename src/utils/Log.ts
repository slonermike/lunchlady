/**
 * Output a string to our specified output channel.
 *
 * @param str String to output.
 */
export function log(str: string) {
    console.log(str);
}

/**
 * Output a string as an error to our specified output channel.
 * @param str String to output as error.
 */
export function error(str: string) {
    console.error(str);
}
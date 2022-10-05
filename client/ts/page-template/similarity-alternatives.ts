// Stops typescript compiler complaining about empty file.
export { };

// /**
//  * Like {@link editDistance}, but returns the result as a scaled score where 1
//  * means the strings are identical and 0 means the strings are nothing alike.
//  * @param query The first string.
//  * @param title The second string.
//  */
// export function similarity(query: string, title: string): number {
//   const editDist = editDistance(query, title);
//   const similarity = 1 - (editDist / Math.max(query.length, title.length));

//   if (similarity > 1) { return 1; }
//   if (similarity < 0) { return 0; }
//   return similarity;
// }

// /**
//  * Returns the number of changes (insertions, deletions, and replacements)
//  * required to change one string to the other. Based on Javascript algorithm
//  * by patel2127 (https://www.geeksforgeeks.org/edit-distance-dp-5/).
//  * @param str1 The first string.
//  * @param str2 The second string.
//  */
// export function editDistance(str1: string, str2: string): number {
//   const len1 = str1.length;
//   const len2 = str2.length;

//   // Create a 2D, 2 * (len1 + 1) sized dynamic programming array to store the
//   // results of previous computations (which could be useful in the future).
//   const dpArray = new Array(2);
//   for (let i = 0; i < 2; i++) {
//     dpArray[i] = new Array(len1 + 1);
//     for (let j = 0; j < len1 + 1; j++) {
//       dpArray[i][j] = 0;
//     }
//   }

//   // Base condition: When the second string is empty, then we remove all
//   // characters.
//   for (let i = 0; i <= len1; i++)
//     dpArray[0][i] = i;

//   // Start filling the array. This loop runs for every character in second
//   // string.
//   for (let i = 1; i <= len2; i++) {

//     // This loop compares the character from second string with first string's
//     // characters.
//     for (let j = 0; j <= len1; j++) {

//       // If first string is empty then we have to perform an "add" character
//       // operation to get the second string.
//       if (j == 0) {
//         dpArray[i % 2][j] = i;
//       }

//       // If the character from both strings are same then we do not perform any
//       // operation.
//       else if (str1[j - 1] == str2[i - 1]) {
//         dpArray[i % 2][j] = dpArray[(i - 1) % 2][j - 1];
//       }

//       // If the character from both strings are not same then we take the
//       // minimum the from three specified operations.
//       else {
//         dpArray[i % 2][j] = 1 + Math.min(dpArray[(i - 1) % 2][j],
//           Math.min(dpArray[i % 2][j - 1],
//             dpArray[(i - 1) % 2][j - 1]));
//       }
//     }
//   }

//   // After this is complete, fill the array. If len2 is even then we end up in
//   // the 0th row, otherwise we end up in the 1th row (so we use len2 % 2 to get
//   // that row).
//   return dpArray[len2 % 2][len1];
// }

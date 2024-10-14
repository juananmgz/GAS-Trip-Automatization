/**
 * Takes an intended frequency in minutes and adjusts it to the closest valid Google "everyMinutes" trigger setting.
 * Acceptable example values: 1, 5, 10, 15, 30.
 *
 * @param {integer} origFrequency - The manually set frequency the user intends to set.
 * @return {integer} The closest valid frequency, defaulting to 15 if no valid input is provided.
 */
function getValidTriggerFrequency(origFrequency) {
  if (origFrequency <= 0) {
    Logger.log("[❗] No valid frequency specified. Defaulting to 15 minutes.");
    return 15;
  }

  const closestFreq = Math.min(Math.max(Math.round(origFrequency / 5) * 5, 1), 15);
  return closestFreq === 15 && Math.abs(origFrequency - 30) < Math.abs(origFrequency - 15) ? 30 : closestFreq;
}

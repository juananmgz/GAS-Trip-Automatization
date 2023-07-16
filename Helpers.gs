/**
 * Removes all triggers for the script's 'startSync' and 'install' function.
 */
function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (
      ["startSync", "install", "main", "checkForUpdate"].includes(
        triggers[i].getHandlerFunction()
      )
    ) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * Search for a calendar which name matches with the one setted in the const "sourceCalendar"
 *
 * @return {string} Uuid of the string. If it fails returns null value
 */
function getSourceCalendarID() {}

/**
 * Takes an intended frequency in minutes and adjusts it to be the closest
 * acceptable value to use Google "everyMinutes" trigger setting (i.e. one of
 * the following values: 1, 5, 10, 15, 30).
 *
 * @param {?integer} The manually set frequency that the user intends to set.
 * @return {integer} The closest valid value to the intended frequency setting. Defaulting to 15 if no valid input is provided.
 */
function getValidTriggerFrequency(origFrequency) {
  if (!origFrequency > 0) {
    Logger.log("No valid frequency specified. Defaulting to 15 minutes.");
    return 15;
  }

  var adjFrequency = Math.round(origFrequency / 5) * 5; // Set the number to be the closest divisible-by-5
  adjFrequency = Math.max(adjFrequency, 1); // Make sure the number is at least 1 (0 is not valid for the trigger)
  adjFrequency = Math.min(adjFrequency, 15); // Make sure the number is at most 15 (will check for the 30 value below)

  if (adjFrequency == 15 && Math.abs(origFrequency - 30) < Math.abs(origFrequency - 15)) adjFrequency = 30; // If we adjusted to 15, but the original number is actually closer to 30, set it to 30 instead

  Logger.log("Intended frequency = " + origFrequency + ", Adjusted frequency = " + adjFrequency);
  return adjFrequency;
}

/**
 * Removes all triggers for the script's 'startSync' and 'install' function.
 */
function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (["startSync", "install", "main", "checkForUpdate"].includes(triggers[i].getHandlerFunction())) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * Search for a calendar which name matches with the one setted in the const "sourceCalendarName".
 *
 * @param {string} Calendar name to be searched.
 * @return {string} Uuid of the string. If it fails returns null value.
 */
function getCalendar(calendarName) {
  let calendars = CalendarApp.getCalendarsByName(calendarName);

  if (calendars.length == 0) {
    Logger.log('[ERROR] No calendar found with name: "' + calendarName + '"');
    return null;
  }

  Logger.log('  1.1. Found calendar "' + calendars[0].getName() + '" (' + calendars[0].getId() + ")");
  return calendars[0];
}

/**
 * Get elements that matches with the topic we are looking for.
 *
 * @param {Calendar} Calendar from which we want to get the events.
 * @return {array} Collection of events.
 */
function getEventsFromCalendar(calendar) {
  let now = new Date();
  let oneYearFromNow = new Date(now.getTime() + 1 * 365 * 24 * 60 * 60 * 1000);
  var events = calendar.getEvents(now, oneYearFromNow);

  return events;
}

/**
 * Check if on the events array exists any event that fits on the transport topic.
 *
 * @param {array} Collection of events we need to clasify (CalendarEvent class)
 * @return {array} Collection of matching events
 */
function checkMatchingElements(events) {
  for (var eventIndex in events) {
    for (var tagIndex in transportTags) {
      if (events[eventIndex].getTitle().toLowerCase().includes(transportTags[tagIndex].toLowerCase())) {
        transportEvents.push(events[eventIndex]);
        Logger.log("    - " + events[eventIndex].getTitle());
      }
    }
  }

  return;
}

/**
 * Copies each event in the target calendar recieved by parameter
 *
 * @param {array} Collection of events we need to clasify (CalendarEvent class)
 * @param {Calenar} Calendar where events will be added
 * @return {array} Collection of matching events
 */
function createEventInNewCalendar(event, calendar) {
  var title = formatEventTitle(event);

  calendar.createEvent(title, event.getStartTime(), event.getEndTime(), {
    description: event.getDescription(),
    location: event.getLocation(),
  });

  return;
}

/**
 * Deletes each event in the source calendar recieved by parameter
 *
 * @param {array} Collection of events we need to clasify (CalendarEvent class)
 * @return {array} Collection of matching events
 */
function removeEventsInOldCalendar(events) {
  for (var eventIndex in events) {
    events[eventIndex].deleteEvent();
  }

  return;
}

/**
 * Detect origen and destination by reading the description of the event
 *
 * @param {array} Collection of events we need to clasify (CalendarEvent class)
 * @return {array} Collection of matching events
 */
function formatEventTitle(event) {
  if (!customFormatForEvent) {
    return event.getTitle();
  }

  var origen = event.getLocation();
  var destination = "";

  let title = event.getTitle().toUpperCase();

  for (var tagIndex in transportTags) {
    if (title.includes(transportTags[tagIndex].toUpperCase())) {
      var titleSplitted = title.split(transportTags[tagIndex].toUpperCase());
      destination = titleSplitted[1].trim();
      break;
    }
  }

  return origen + " → " + destination;
}

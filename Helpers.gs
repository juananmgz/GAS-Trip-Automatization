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

  Logger.log('  - Found calendar "' + calendars[0].getName() + '" (' + calendars[0].getId() + ")");
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
 * If matches with that topic, pushes it into transportEvents, and gets the origen and
 * destination and stores it in transportEventsFormatted
 *
 * @return {array} Collection of matching events
 */
function checkMatchingElements() {
  for (var eventIndex in allEvents) {
    for (var tagIndex in transportTags) {
      let title = allEvents[eventIndex].getTitle().toUpperCase();

      // Check if matches with any transport tag
      if (title.includes(transportTags[tagIndex].toUpperCase())) {
        Logger.log("     * " + allEvents[eventIndex].getTitle() + " (" + allEvents[eventIndex].getId() + ")");
        transportEvents.push(allEvents[eventIndex]);

        // Get origen and destination
        var data = {
          eventId: allEvents[eventIndex].getId(),
          origen: allEvents[eventIndex].getLocation(),
          destination: "??",
          alreadyUsed: false,
        };

        var titleSplitted = title.split(transportTags[tagIndex].toUpperCase());
        data.destination = titleSplitted[1].trim();
        transportEventsFormatted.push(data);
        break;
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
 * Format title of the event
 *
 * @param {CalendarEvent} Event from we need to get the data
 * @return {array} Collection of matching events
 */
function formatEventTitle(event) {
  if (!customFormatForEvent) {
    return event.getTitle();
  }

  data = transportEventsFormatted.find((obj) => obj.eventId === event.getId());

  return data.origen + " → " + data.destination;
}

/**
 * Generate trip events for round trips. Having 2 trips A and B, we need to detect
 * go & back trips (A.origen == B.destination and A.origen == B.destination)
 *
 * @param {CalendarEvent} Event from we need to get the data
 * @return {array} Collection of matching events
 */
function generateTripEvents(event) {
  for (var eventIndex in transportEventsFormatted) {
    // Checks if first trip destination is equal to second trip origen
    let destinationTmp = transportEventsFormatted[eventIndex].destination;

    // If is not already used for other trip
    if (!transportEventsFormatted[eventIndex].alreadyUsed) {
      for (var i = eventIndex; i < transportEventsFormatted.length; i++) {
        if (destinationTmp == transportEventsFormatted[i].origen) {
          var startEvent = allEvents.find((obj) => obj.getId() === transportEventsFormatted[eventIndex].eventId);
          var endEvent = allEvents.find((obj) => obj.getId() === transportEventsFormatted[i].eventId);
          var location = transportEventsFormatted[eventIndex].destination;

          let startTime = startEvent.getEndTime();
          let endTime = endEvent.getStartTime();

          oneMonth = 30 * 24 * 60 * 60 * 1000; // Maximum one month trips

          // Creates the event in targetCalendar
          if (startTime.getMonth() + oneMonth > endTime.getMonth()) {
            targetCalendar.createEvent(permuteTitle(location), startTime, endTime, {
              location: location,
            });

            startEvent.alreadyUsed = true;
            endEvent.alreadyUsed = true;

            Logger.log("     * Creating new Stay Event in " + permuteTitle(location));
          }
        }
      }
    }
  }
}

/**
 * Generate trip events for round trips. Having 2 trips A and B, we need to detect
 * go & back trips (A.origen == B.destination and A.origen == B.destination)
 *
 * @param {CalendarEvent} Event from we need to get the data
 * @return {array} Collection of matching events
 */
function permuteTitle(origTitle) {
  var title = permuter[origTitle];

  return title ? capitalizeFirstLetter(title) : origTitle;
}

/**
 * Capitalize first letter of each word in the string recieved by parameter
 *
 * @param {string} text to format
 * @return {string} text formatted
 */
function capitalizeFirstLetter(text) {
  const textSplitted = text.split(" ");

  for (var i = 0; i < textSplitted.length; i++) {
    textSplitted[i] = textSplitted[i].charAt(0).toUpperCase() + textSplitted[i].slice(1);
  }

  return textSplitted.join(" ");
}

/**
 * Takes an intended frequency in minutes and adjusts it to the closest valid Google "everyMinutes" trigger setting.
 *
 */
function resetGlobals() {
  sourceCalendar = targetCalendar = null;
  allEvents = transportEvents = matchedEvents = [];
}

function detectTransportEvents() {
  Logger.log("Finding transport events in source calendar");
  checkMatchingElements();
}

function executeExtraFeatures() {
  Logger.log("- Applying extra features");

  transportEvents.forEach((event) => {
    if (RENAME_EVENTS) {
      Logger.log("  * Renaming events");
      event.setTitle(formatEventTitle(event));
    }
    if (RECOLOR_EVENTS) {
      Logger.log("  * Recoloring events");
      event.setColor(NEW_EVENT_COLOR);
    }
    if (MOVE_EVENTS) {
      Logger.log(`  * Moving events to ${TARGET_CALENDAR}`);
      createEventInNewCalendar(event, targetCalendar);
    }
  });
}

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

/**
 * Removes all triggers for the script's 'startSync' and 'install' functions.
 */
function deleteAllTriggers() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (["startSync", "install"].includes(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Search for a calendar matching the name set in the const "sourceCalendarName".
 *
 * @param {string} calendarName - The name of the calendar to search for.
 * @return {Calendar|null} The found calendar, or null if none is found.
 */
function getCalendar(calendarName) {
  const calendars = CalendarApp.getCalendarsByName(calendarName);

  if (!calendars.length) {
    Logger.log(`[❗] No calendar found with name: "${calendarName}"`);
    return null;
  }

  Logger.log(`- Found calendar "${calendars[0].getName()}" (${calendars[0].getId()})`);
  return calendars[0];
}

/**
 * Get events from the calendar occurring within the next year.
 *
 * @param {Calendar} calendar - The calendar to retrieve events from.
 * @return {CalendarEvent[]} The events occurring within the next year.
 */
function getEventsFromCalendar(calendar) {
  const now = new Date();
  const oneYearFromNow = new Date(now.setFullYear(now.getFullYear() + 1));
  return calendar.getEvents(new Date(), oneYearFromNow);
}

/**
 * Check for transport-related events in the events array, extract the relevant details, and store formatted events.
 */
function checkMatchingElements() {
  allEvents.forEach((event) => {
    const title = event.getTitle().toUpperCase();
    transportTags.forEach((tag) => {
      if (title.includes(tag.toUpperCase())) {
        Logger.log(`  * ${event.getTitle()} (${event.getId()})`);
        transportEvents.push(event);

        const [_, destination] = title.split(tag.toUpperCase());
        transportEventsFormatted.push({
          eventId: event.getId(),
          eventTitle: event.getTitle(),
          origen: event.getLocation(),
          destination: destination?.trim() || "??",
        });
      }
    });
  });
}

/**
 * Copies an event to the target calendar if it doesn't already exist.
 *
 * @param {CalendarEvent} event - The event to copy.
 * @param {Calendar} calendar - The target calendar.
 */
function createEventInNewCalendar(event, calendar) {
  const title = formatEventTitle(event);

  if (calendar.getEventsForDay(event.getStartTime(), { search: event.getTitle() }).length) {
    Logger.log(`  * Skipping copying Event ${title}. Already exists in ${targetCalendarName}.`);
    return;
  }

  calendar.createEvent(title, event.getStartTime(), event.getEndTime(), {
    description: event.getDescription(),
    location: event.getLocation(),
  });

  Logger.log(`  * Copied Event ${title} to ${targetCalendarName}`);
}

/**
 * Deletes the specified events from the calendar.
 *
 * @param {CalendarEvent[]} events - The events to delete.
 */
function removeEventsInOldCalendar(events) {
  events.forEach((event) => event.deleteEvent());
}

/**
 * Generate trip events for round trips, detecting go and return trips.
 */
function generateTripEvents() {
  const dateFromNow = new Date(now.getTime() + rangeTime * 60 * 1000);

  transportEventsFormatted.forEach((eventA, indexA) => {
    const locationA = permuteTitle(eventA.destination);
    Logger.log(`  * Event: ${eventA.eventTitle}`);

    for (let i = indexA; i < transportEventsFormatted.length; i++) {
      const eventB = transportEventsFormatted[i];

      if (isStayBetweenEvents(eventA.eventId, eventB.eventId) && locationA === permuteTitle(eventB.origen)) {
        const startEvent = allEvents.find((e) => e.getId() === eventA.eventId);
        const endEvent = allEvents.find((e) => e.getId() === eventB.eventId);

        if (checkTwoDates(startEvent.getEndTime(), endEvent.getStartTime(), rangeTime)) {
          if (!targetCalendar.getEvents(now, dateFromNow).some((e) => checkTwoDates(startEvent.getEndTime(), e.getStartTime(), 5))) {
            targetCalendar.createEvent(permuteTitle(locationA), startEvent.getEndTime(), endEvent.getStartTime(), { location: locationA });
            Logger.log(`  * Created new Stay Event in ${locationA}`);
          }
        }
      }
    }
  });
}

/**
 * Format the title of an event according to custom formatting rules.
 *
 * @param {CalendarEvent} event - The event to format.
 * @return {string} The formatted event title.
 */
function formatEventTitle(event) {
  if (!customFormatForEvent) return event.getTitle();

  const eventData = transportEventsFormatted.find((e) => e.eventId === event.getId());
  return `${eventData.origen} → ${eventData.destination}`;
}

/**
 * Return the permuted title if exists, otherwise capitalize each word in the title.
 *
 * @param {string} origTitle - The original title.
 * @return {string} The permuted or capitalized title.
 */
function permuteTitle(origTitle) {
  return permuter[origTitle] ? capitalizeFirstLetter(permuter[origTitle]) : capitalizeFirstLetter(origTitle);
}

/**
 * Capitalize the first letter of each word in a given text.
 *
 * @param {string} text - The text to format.
 * @return {string} The formatted text.
 */
function capitalizeFirstLetter(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Check if the time difference between two dates is within the specified range.
 *
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @param {number} range - The range in minutes.
 * @return {boolean} True if the time difference is within the range.
 */
function checkTwoDates(date1, date2, range) {
  const diffMinutes = (date1 - date2) / 60000;
  return Math.abs(diffMinutes) < range;
}

/**
 * Check if two events are not considered as a stay (i.e., time difference is too small).
 *
 * @param {string} startEventId - The ID of the first event.
 * @param {string} nextEventId - The ID of the next event.
 * @return {boolean} True if the time between the two events indicates no stay.
 */
function isStayBetweenEvents(startEventId, nextEventId) {
  const startEvent = allEvents.find((e) => e.getId() === startEventId);
  const nextEvent = allEvents.find((e) => e.getId() === nextEventId);
  return checkTwoDates(startEvent.getEndTime(), nextEvent.getStartTime(), 240);
}

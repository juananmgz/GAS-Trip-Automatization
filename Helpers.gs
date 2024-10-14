/**
 * Adjusts the given frequency in minutes to the closest valid Google "everyMinutes" trigger setting.
 */
function resetGlobals() {
  sourceCalendar = targetCalendar = null;
  allEvents = transportEvents = matchedEvents = [];
}

/**
 * Detects transport events and logs the action.
 */
function detectTransportEvents() {
  Logger.log("- Finding transport events in source calendar");
  checkMatchingElements();
}

/**
 * Executes extra features based on the configuration variables.
 */
function executeExtraFeatures() {
  transportEvents.forEach((event) => {
    Logger.log(`- Applying extra features on ${event.eventTitle}`);
    if (CONFIG.RENAME_EVENTS) {
      Logger.log("  * Renaming event");
      event.setTitle(formatEventTitle(event));
    }
    if (CONFIG.RECOLOR_EVENTS) {
      Logger.log("  * Recoloring event");
      event.setColor(CONFIG.NEW_EVENT_COLOR);
    }
    if (CONFIG.MOVE_EVENTS) {
      Logger.log(`  * Moving event to ${CONFIG.TARGET_CALENDAR}`);
      createEventInNewCalendar(event, targetCalendar);
    }
  });
}

/**
 * Deletes all triggers for 'startSync' and 'install' functions to avoid duplicates.
 */
function deleteAllTriggers() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (["startSync", "install"].includes(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Fetches the calendar by name.
 *
 * @param {string} calendarName - The name of the calendar to search for.
 * @return {Calendar|null} - Returns the calendar object or null if not found.
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
 * Retrieves events from the specified calendar occurring within the next year.
 *
 * @param {Calendar} calendar - The calendar to retrieve events from.
 * @return {CalendarEvent[]} - Returns an array of events occurring within the next year.
 */
function getEventsFromCalendar(calendar) {
  const oneYearFromNow = new Date(CONFIG.NOW.setFullYear(CONFIG.NOW.getFullYear() + 1));
  return calendar.getEvents(new Date(), oneYearFromNow);
}

/**
 * Identifies transport-related events from the calendar and stores the relevant details.
 */
function checkMatchingElements() {
  allEvents.forEach((event) => {
    const title = event.getTitle().toUpperCase();
    CONFIG.TRANSPORT_TAGS.forEach((tag) => {
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
 * @param {Calendar} calendar - The target calendar where the event will be copied.
 */
function createEventInNewCalendar(event, calendar) {
  const title = formatEventTitle(event);

  if (calendar.getEventsForDay(event.getStartTime(), { search: event.getTitle() }).length) {
    Logger.log(`  * Skipping copying Event ${title}. Already exists in ${CONFIG.TARGET_CALENDAR}.`);
    return;
  }

  calendar.createEvent(title, event.getStartTime(), event.getEndTime(), {
    description: event.getDescription(),
    location: event.getLocation(),
  });
}

/**
 * Deletes the specified events from the source calendar.
 *
 * @param {CalendarEvent[]} events - The events to delete.
 */
function removeEventsInOldCalendar(events) {
  events.forEach((event) => event.deleteEvent());
}

/**
 * Generates trip stay events between matching start and end events (i.e., round trips).
 */
function generateTripEvents() {
  const dateFromNow = new Date(CONFIG.NOW.getTime() + CONFIG.MAX_TRIP_DURATION * 60 * 1000);

  transportEventsFormatted.forEach((eventA, indexA) => {
    const locationA = permuteTitle(eventA.destination);
    Logger.log(`  * Event: ${eventA.eventTitle}`);

    for (let i = indexA; i < transportEventsFormatted.length; i++) {
      const eventB = transportEventsFormatted[i];

      if (isStayBetweenEvents(eventA.eventId, eventB.eventId) && locationA === permuteTitle(eventB.origen)) {
        const startEvent = allEvents.find((e) => e.getId() === eventA.eventId);
        const endEvent = allEvents.find((e) => e.getId() === eventB.eventId);

        if (checkTwoDates(startEvent.getEndTime(), endEvent.getStartTime(), CONFIG.MAX_TRIP_DURATION)) {
          if (!targetCalendar.getEvents(CONFIG.NOW, dateFromNow).some((e) => checkTwoDates(startEvent.getEndTime(), e.getStartTime(), 5))) {
            targetCalendar.createEvent(locationA, startEvent.getEndTime(), endEvent.getStartTime(), { location: locationA });
            Logger.log(`  * Created new Stay Event in ${locationA}`);
          }
        }
      }
    }
  });
}

/**
 * Formats the title of an event using custom formatting rules.
 *
 * @param {CalendarEvent} event - The event to format.
 * @return {string} - Returns the formatted event title.
 */
function formatEventTitle(event) {
  if (!CONFIG.ENABLE_CUSTOM_FORMAT) return event.getTitle();

  const eventData = transportEventsFormatted.find((e) => e.eventId === event.getId());
  const title = event.getTitle().toUpperCase(); // Make the title uppercase for comparison

  for (const tag of CONFIG.TRANSPORT_TAGS) {
    const firstWord = tag.split(" ")[0]; // Extract the first word and convert to uppercase

    if (title.includes(firstWord.toUpperCase())) {
      return `${firstWord} ${eventData.origen} to ${eventData.destination}`;
    }
  }

  return event.getTitle(); // Return original title if no match found
}

/**
 * Returns a permuted title if available, otherwise capitalizes the first letter of each word.
 *
 * @param {string} origTitle - The original title.
 * @return {string} - Returns the permuted or capitalized title.
 */
function permuteTitle(origTitle) {
  return permuter[origTitle] ? capitalizeFirstLetter(permuter[origTitle]) : capitalizeFirstLetter(origTitle);
}

/**
 * Capitalizes the first letter of each word in the provided text.
 *
 * @param {string} text - The text to format.
 * @return {string} - The text with each word's first letter capitalized.
 */
function capitalizeFirstLetter(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Checks if the time difference between two dates is within the specified range.
 *
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @param {number} range - The range in minutes.
 * @return {boolean} - True if the time difference is within the range.
 */
function checkTwoDates(date1, date2, range) {
  const diffMinutes = (date1 - date2) / 60000;
  return Math.abs(diffMinutes) < range;
}

/**
 * Checks if two events are not considered as a stay (i.e., time difference is too small).
 *
 * @param {string} startEventId - The ID of the first event.
 * @param {string} nextEventId - The ID of the next event.
 * @return {boolean} - True if the time between the two events indicates no stay.
 */
function isStayBetweenEvents(startEventId, nextEventId) {
  return startEventId !== nextEventId;
}

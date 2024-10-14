/**
 *=========================================
 *           ABOUT THE AUTHOR
 *=========================================
 *
 * This program was created by Juan Antonio Muñoz Gómez (Juanan)
 *
 * If you would like tao see other programs Juanan has made, you can check out
 * his website: juananmgz.com or his github: https://github.com/juananmgz
 *
 *=========================================
 *               SETTINGS
 *=========================================
 */

const CONFIG = {
  SOURCE_CALENDAR: "General", // Source calendar for events
  TARGET_CALENDAR: "Viajes", // Target calendar for new events
  SYNC_INTERVAL_MINUTES: 1, // Script run interval in minutes
  ENABLE_TRIP_EVENT: true, // Create trip events between trips
  MOVE_EVENTS: true, // Move events from source to target calendar
  ENABLE_CUSTOM_FORMAT: true, // Enable custom formatting for events
  DELETE_EVENTS: true, // Delete events from the source calendar
  RENAME_EVENTS: true, // Rename existing events
  RECOLOR_EVENTS: true, // Recolor existing events
  TRANSPORT_TAGS: [
    // Tags to identify trip events
    "Train to",
    "Flight to",
    "Bus to",
  ],
  NEW_EVENT_COLOR: "2", // Color for matched events (see https://developers.google.com/apps-script/reference/calendar/event-color)
  MAX_TRIP_DURATION: 31 * 24 * 60, // Maximum trip duration in minutes (31 days)
  NOW: new Date(), // Current date
};

//=====================================================================================================
//!!!!!!!!!!!!!!!! DO NOT EDIT BELOW HERE UNLESS YOU REALLY KNOW WHAT YOU'RE DOING !!!!!!!!!!!!!!!!!!!!
//=====================================================================================================

function install() {
  //Delete any already existing triggers so we don't create excessive triggers
  deleteAllTriggers();

  //Schedule sync routine to explicitly repeat and schedule the initial sync
  ScriptApp.newTrigger("startSync").timeBased().everyMinutes(getValidTriggerFrequency(CONFIG.SYNC_INTERVAL_MINUTES)).create();
  ScriptApp.newTrigger("startSync").timeBased().after(1000).create();

  //Schedule sync routine to look for update once per day
  ScriptApp.newTrigger("checkForUpdate").timeBased().everyDays(1).create();
}

function uninstall() {
  deleteAllTriggers();
}

// Per-calendar global variables (must be reset before processing each new calendar!)
var sourceCalendar;
var targetCalendar;
var allEvents = [];
var transportEvents = [];
var transportEventsFormatted = [];

// Per-session global variables (must NOT be reset before processing each new calendar!)
var matchedEvents = [];

function startSync() {
  const lastRun = PropertiesService.getUserProperties().getProperty("LastRun");
  const timeSinceLastRun = new Date().getTime() - lastRun;
  /*
  if (lastRun && timeSinceLastRun < 360000) {
    Logger.log("[❗] Another sync is currently running! Exiting...");
    return;
  }
  */
  PropertiesService.getUserProperties().setProperty("LastRun", new Date().getTime());

  resetGlobals();

  sourceCalendar = getCalendar(CONFIG.SOURCE_CALENDAR);
  if (!sourceCalendar) return Logger.log("[❗] Source calendar not found!");

  targetCalendar = getCalendar(CONFIG.TARGET_CALENDAR);
  if (!targetCalendar) return Logger.log("[❗] Target calendar not found!");

  allEvents = getEventsFromCalendar(sourceCalendar);

  detectTransportEvents();

  executeExtraFeatures();

  if (CONFIG.ENABLE_TRIP_EVENT) {
    Logger.log("Creating trip stay events");
    generateTripEvents();
  }

  if (CONFIG.DELETE_EVENTS && CONFIG.MOVE_EVENTS) {
    Logger.log("Removing matched events from source calendar");
    removeEventsInOldCalendar(transportEvents);
  } else if (CONFIG.DELETE_EVENTS && !CONFIG.MOVE_EVENTS) {
    Logger.log("[❗] Deleting events requires moving them first!");
  }

  Logger.log("Sync finished!");
  PropertiesService.getUserProperties().setProperty("LastRun", 0);
}

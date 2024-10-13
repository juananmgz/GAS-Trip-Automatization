/**
 *=========================================
 *           ABOUT THE AUTHOR
 *=========================================
 *
 * This program was created by Juan Antonio Muñoz Gómez (Juanan)
 *
 * If you would like to see other programs Juanan has made, you can check out
 * his website: juananmgz.com or his github: https://github.com/juananmgz
 *
 *=========================================
 *               SETTINGS
 *=========================================
 */

const sourceCalendarName = "General";  // Source calendar where events are being set initially
const targetCalendarName = "Viajes";   // Target calendar where we want to configure the new events

const howFrequent = 1;                 // What interval (minutes) to run this script on to check for new events
const createTripEvent = true;          // Create trip stay event between two trips

const moveEventsToNewCalendar = true;  // Enable moving the events from source Calendar to Target Calendar
const customFormatForEvent = true;     // Enable custom formatting of events
const deleteExistingEvents = true;     // Delates the event from the original Calendar
const renameExistingEvents = true;     // Renames the already created event (if enabled, check to disable deleteExistingCalendar)
const recolorExistingEvents = true;    // Change color of the already created event (if enabled, check to disable deleteExistingCalendar)

const transportTags = [                // Tags to be matched as trip events
  "Train to",
  "Flight to",
  "Bus to",
];
/*const customLabels = [                 // Labels to custom formats (name, description...)
  {
    company: "Renfe",
    origenLabel: "Departure",
    destinationLabel: "Arrival",
  },
];*/
const newColor = "2";                  // Color to be setted on matching events. You can follow this mapping https://developers.google.com/apps-script/reference/calendar/event-color,

const rangeTime = 31 * 24 * 60;        // Maximum one month trips
const now = new Date();                // Actual Date

/*
 *=========================================
 *           ABOUT THE AUTHOR
 *=========================================
 *
 * This program was created by Juan Antonio Muñoz Gómez (Juanan)
 *
 * If you would like to see other programs Juanan has made, you can check out
 * his website: juananmgz.com or his github: https://github.com/juananmgz
 *
 *=========================================
 *            BUGS/FEATURES
 *=========================================
 *
 * Please report any issues at https://github.com/juananmgz/GAS-Trip-Automatization/issues
 *
 *=========================================
 *           $$ DONATIONS $$
 *=========================================
 *
 * If you would like to donate and support the project,
 * you can do that here: https://www.paypal.me/juananmgz
 *
 *=========================================
 *             CONTRIBUTORS
 *=========================================
 * [name]
 * Github: https://github.com/[github]
 * Twitter: @[twitter]
 *
 */

//=====================================================================================================
//!!!!!!!!!!!!!!!! DO NOT EDIT BELOW HERE UNLESS YOU REALLY KNOW WHAT YOU'RE DOING !!!!!!!!!!!!!!!!!!!!
//=====================================================================================================

function install() {
  //Delete any already existing triggers so we don't create excessive triggers
  deleteAllTriggers();

  //Schedule sync routine to explicitly repeat and schedule the initial sync
  ScriptApp.newTrigger("startSync").timeBased().everyMinutes(getValidTriggerFrequency(howFrequent)).create();
  ScriptApp.newTrigger("startSync").timeBased().after(1000).create();

  //Schedule sync routine to look for update once per day
  ScriptApp.newTrigger("checkForUpdate").timeBased().everyDays(1).create();
}

function uninstall() {
  deleteAllTriggers();
}

// Per-calendar global variables (must be reset before processing each new calendar!)
var sourceCalendar;
var sourceCalendarId;
var targetCalendar;
var targetCalendarId;
var allEvents = [];
var transportEvents = [];
var transportEventsFormatted = [];

// Per-session global variables (must NOT be reset before processing each new calendar!)
var matchedEvents = [];

function startSync() {
  const lastRun = PropertiesService.getUserProperties().getProperty("LastRun");
  const timeSinceLastRun = new Date().getTime() - lastRun;
  if (lastRun && timeSinceLastRun < 360000) {
    Logger.log("[❗] Another sync is currently running! Exiting...");
    return;
  }
  PropertiesService.getUserProperties().setProperty("LastRun", new Date().getTime());

  resetGlobals();

  sourceCalendar = getCalendar(SOURCE_CALENDAR);
  if (!sourceCalendar) return Logger.log("[❗] Source calendar not found!");

  targetCalendar = getCalendar(TARGET_CALENDAR);
  if (!targetCalendar) return Logger.log("[❗] Target calendar not found!");

  allEvents = getEventsFromCalendar(sourceCalendar);

  detectTransportEvents();

  executeExtraFeatures();

  if (ENABLE_TRIP_EVENT) {
    Logger.log("Creating trip stay events");
    generateTripEvents();
  }

  if (DELETE_EVENTS && MOVE_EVENTS) {
    Logger.log("Removing matched events from source calendar");
    removeEventsInOldCalendar(transportEvents);
  } else if (DELETE_EVENTS && !MOVE_EVENTS) {
    Logger.log("[❗] Deleting events requires moving them first!");
  }

  Logger.log("Sync finished!");
  PropertiesService.getUserProperties().setProperty("LastRun", 0);
}

/*
 *=========================================
 *               TEST SUITE
 *=========================================
 */

const createTestSuite = true; // Create test suite to test new features
const cleanTestSuite = true; // Clean test suite to test new features
const testSuiteChosen = 1; // You may chose: 1 [simple trip], 2 [2 stays continuous trip], 3 [5 stays continuous trip], 4 [stays overlapping], 5 [TO DO: complex trip]

function startTestSuite() {
  PropertiesService.getUserProperties().setProperty("LastRun", new Date().getTime());

  //------------------------ Reset globals ------------------------
  sourceCalendar = null;
  sourceCalendarId = "";
  targetCalendar = null;
  targetCalendarId = "";
  allEvents = [];
  transportEvents = [];
  transportEventsFormatted = [];

  //------------------------ Get Source Calendar ------------------------
  Logger.log('Getting "' + sourceCalendarName + '" Source Calendar');
  sourceCalendar = getCalendar(sourceCalendarName);

  if (sourceCalendar == null) {
    Logger.log("Sync failed!");
    return;
  }

  sourceCalendarId = sourceCalendar.getId();

  //------------------------ Get Target Calendar ------------------------
  Logger.log('Getting "' + targetCalendarName + '" Target Calendar');
  targetCalendar = getCalendar(targetCalendarName);

  if (targetCalendar == null) {
    Logger.log("Sync failed!");
    return;
  }

  sourceCalendarId = sourceCalendar.getId();

  //------------------------ Test Suite ------------------------
  Logger.log("[TEST] Preparing test suite...");

  if (cleanTestSuite) {
    cleanTestEvents();
  }

  if (createTestSuite) {
    createTestEvents();
  }
}

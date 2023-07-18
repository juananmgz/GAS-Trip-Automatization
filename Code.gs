/*
 *=========================================
 *       INSTALLATION INSTRUCTIONS
 *=========================================
 *
 * 1) Make a copy:
 *      New Interface: Go to the project overview icon on the left (looks like this: ⓘ), then click the "copy" icon on the top right (looks like two files on top of each other)
 *      Old Interface: Click in the menu "File" > "Make a copy..." and make a copy to your Google Drive
 * 2) Settings: Change lines 24-50 to be the settings that you want to use
 * 3) Install:
 *      New Interface: Make sure your toolbar says "install" to the right of "Debug", then click "Run"
 *      Old Interface: Click "Run" > "Run function" > "install"
 * 4) Authorize: You will be prompted to authorize the program and will need to click "Advanced" > "Go to GAS-Trip-Automatization (unsafe)"
 * 5) You can also run "startSync" if you want to sync only once (New Interface: change the dropdown to the right of "Debug" from "install" to "startSync")
 *
 * **To stop the Script from running click in the menu "Run" > "Run function" > "uninstall" (New Interface: change the dropdown to the right of "Debug" from "install" to "uninstall")
 *
 *=========================================
 *               SETTINGS
 *=========================================
 */

const sourceCalendarName = "General";  // Source calendar where events are being set initially
const targetCalendarName = "Viajes";   // Target calendar where we want to configure the new events

const howFrequent = 1;                 // What interval (minutes) to run this script on to check for new events
const createTripEvent = true;          // Create trip stay event between two trips

const moveEventsToNewCalendar = false; // Enable moving the events from source Calendar to Target Calendar
const deleteExistingEvents = false;    // Delates the event from the original Calendar
const renameExistingEvents = false;    // Renames the already created event (if enabled, check to disable deleteExistingCalendar)
const recolorExistingEvents = true;    // Change color of the already created event (if enabled, check to disable deleteExistingCalendar)

const transportTags = [                // Tags to be matched as trip events
  "Train to",
  "Flight to",
  "Bus to",
];
const newColor = "2";                  // Color to be setted on matching events. You can follow this mapping https://developers.google.com/apps-script/reference/calendar/event-color,
const customFormatForEvent = true;     // Enable custom formatting of events
const customLabels = [                 // Labels to custom formats (name, description...)
  {
    company: "Renfe",
    origenLabel: "Departure",
    destinationLabel: "Arrival",
  },
];

/*
 *=========================================
 *           ABOUT THE AUTHOR
 *=========================================
 *
 * This program was created by Derek Antrican
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
  /*if (PropertiesService.getUserProperties().getProperty("LastRun") > 0 && new Date().getTime() - PropertiesService.getUserProperties().getProperty("LastRun") < 360000) {
    Logger.log("Another iteration is currently running! Exiting...");
    return;
  }*/

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

  //------------------------ Find matching elements of Source Calendar ------------------------
  allEvents = getEventsFromCalendar(sourceCalendar);

  //------------------------ Detect transport events --------------------------
  Logger.log('Finding matching elements on "' + sourceCalendarName + '" Source Calendar');
  checkMatchingElements();

  //------------------------ Extra Features ------------------------
  Logger.log("Executing extra features");
  moveEventsToNewCalendar ? Logger.log('  - Moving matched events to "' + targetCalendarName + '" Target Calendar') : null;
  renameExistingEvents ? Logger.log("  - Renaming events") : null;
  recolorExistingEvents ? Logger.log("  - Recoloring events") : null;

  for (var eventIndex in transportEvents) {
    //------------------------ Move event to Target Calendar ------------------------
    if (moveEventsToNewCalendar) {
      createEventsInNewCalendar(transportEvents[eventIndex], targetCalendar);
    }

    //------------------------ Custom event if the're not being deleted ------------------------
    if (!deleteExistingEvents) {
      //------------------------ Rename events on Source Calendar ------------------------
      if (renameExistingEvents) {
        transportEvents[eventIndex].setTitle(formatEventTitle(transportEvents[eventIndex]));
      }

      //------------------------ Recolor events on Source Calendar ------------------------
      if (recolorExistingEvents) {
        transportEvents[eventIndex].setColor(newColor);
      }
    }
  }

  //------------------------ Create trip event in Target Calendar ------------------------
  if (createTripEvent) {
    Logger.log("Creating trip stays events");
    generateTripEvents();
  }

  //------------------------ Remove old events from Source Calendar ------------------------
  if (deleteExistingEvents) {
    Logger.log('Removing matched events to "' + sourceCalendarName + '" Source Calendar');
    removeEventsInOldCalendar(transportEvents);
  }

  //------------------------ Add Recurring Event Instances ------------------------

  Logger.log("Sync finished!");
  PropertiesService.getUserProperties().setProperty("LastRun", 0);
}

/*
 *=========================================
 *               TEST SUITE
 *=========================================
 */

const createTestSuite = false;  // Create test suite to test new features
const cleanTestSuite = true;    // Clean test suite to test new features
const testSuiteChosen = 3;      // You may chose: 1 [simple trip], 2 [2 stays continuous trip], 3 [5 stays continuous trip], 4 [stays overlapping], 5 [TO DO: complex trip]

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

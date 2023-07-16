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

var sourceCalendar = "Actuaciones"; // Source calendar where events are being set initially
var targetCalendar = "Clase / Trabajo"; // Target calendar where we want to configure the new events

var howFrequent = 1; // What interval (minutes) to run this script on to check for new events

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

var defaultMaxRetries = 10; // Maximum number of retries for api functions (with exponential backoff)

function install() {
  //Delete any already existing triggers so we don't create excessive triggers
  deleteAllTriggers();

  //Schedule sync routine to explicitly repeat and schedule the initial sync
  ScriptApp.newTrigger("startSync")
    .timeBased()
    .everyMinutes(getValidTriggerFrequency(howFrequent))
    .create();
  ScriptApp.newTrigger("startSync").timeBased().after(1000).create();

  //Schedule sync routine to look for update once per day
  ScriptApp.newTrigger("checkForUpdate").timeBased().everyDays(1).create();
}

function uninstall() {
  deleteAllTriggers();
}

// Per-calendar global variables (must be reset before processing each new calendar!)
var calendarEvents = [];
var calendarEventsIds = [];
var targetCalendarId;

// Per-session global variables (must NOT be reset before processing each new calendar!)
var matchedEvents = [];

function startSync() {
  if (
    PropertiesService.getUserProperties().getProperty("LastRun") > 0 &&
    new Date().getTime() -
      PropertiesService.getUserProperties().getProperty("LastRun") <
      360000
  ) {
    Logger.log("Another iteration is currently running! Exiting...");
    return;
  }

  PropertiesService.getUserProperties().setProperty(
    "LastRun",
    new Date().getTime()
  );

  //------------------------ Reset globals ------------------------
  calendarEvents = [];
  calendarEventsIds = [];

  //------------------------ Get ID of calendar ------------------------
  targetCalendarId = getSourceCalendarID(sourceCalendar);

  //------------------------ Get elements of calendar ------------------------
  calendarEvents = getEventsFromSourceCalendar(targetCalendarName);

  //------------------------ Detect transport events --------------------------

  //------------------------ Create events in target calendar ------------------------

  //------------------------ Remove old events from source calendar ------------------------

  //------------------------ Add Recurring Event Instances ------------------------

  Logger.log("Sync finished!");
  PropertiesService.getUserProperties().setProperty("LastRun", 0);
}

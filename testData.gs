/*
 *=========================================
 *       TEST INSTRUCTIONS
 *=========================================
 *
 * You can Modify the data of the tests. There are the followings test suites:
 *   - Test simple trip:                A → B [stay] B → A
 *   - Test continuous trip (2 stays):  A → B [stay] B → C [stay] C → A
 *   - Test continuous trip (5 stays):  A → B [stay] B → C [stay] C → D [stay] D → E [stay] E → F [stay] F → A
 *   - Test overlapping stays trip:     A → B [stay] B → C [stay] C → B [stay] B → A
 */

const descriptionTest = "This is an automatically event generated by testSuite";

var testSimpleTrip = [
  // SIMPLE TRIP
  {
    title: "Train to MADRID-CHAMARTÍN-CLARA CA",
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 155 * 60 * 1000),
    location: "SALAMANCA",
  },
  {
    title: "Train to SALAMANCA",
    startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 250 * 60 * 1000),
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 360 * 60 * 1000),
    location: "MADRID-CHAMARTÍN-CLARA CA",
  },
];

var testContinuousStaysShortTrip = [
  // 2 CONTINUOUS STAYS TRIP
  {
    title: "Flight to MUNICH",
    startTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 155 * 60 * 1000),
    location: "MADRID",
  },
  {
    title: "Train to HAMBURGO",
    startTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 250 * 60 * 1000),
    endTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 360 * 60 * 1000),
    location: "MUNICH",
  },
  {
    title: "FLIGHT to MADRID",
    startTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 - 100 * 60 * 1000),
    endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
    location: "HAMBURGO",
  },
];

var testContinuousStaysLongTrip = [
  // 5 CONTINUOUS STAYS TRIP
  {
    title: "Flight to MUNICH",
    startTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 221 * 60 * 1000),
    location: "MADRID",
  },
  {
    title: "Train to BERLIN",
    startTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 250 * 60 * 1000),
    endTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 360 * 60 * 1000),
    location: "MUNICH",
  },
  {
    title: "Train to HAMBURGO",
    startTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 - 100 * 60 * 1000),
    endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
    location: "BERLIN",
  },
  {
    title: "Train to BREMEN",
    startTime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000 - 400 * 60 * 1000),
    endTime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000 - 225 * 60 * 1000),
    location: "HAMBURGO",
  },
  {
    title: "Train to COPENHAGEN",
    startTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 500 * 60 * 1000),
    endTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 610 * 60 * 1000),
    location: "BREMEN",
  },
  {
    title: "FLIGHT to MADRID",
    startTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000 + 240 * 60 * 1000),
    location: "COPENHAGEN",
  },
];

var testOverlappingStays = [
  // 2 OVERLAPPING STAYS TRIP
  {
    title: "Train to MADRID-CHAMARTÍN-CLARA CA",
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 155 * 60 * 1000),
    location: "SALAMANCA",
  },
  {
    title: "Train to SANTANDER",
    startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 250 * 60 * 1000),
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 360 * 60 * 1000),
    location: "MADRID-CHAMARTÍN-CLARA CA",
  },
  {
    title: "Train to MADRID-CHAMARTÍN-CLARA CA",
    startTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 250 * 60 * 1000),
    endTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 360 * 60 * 1000),
    location: "SANTANDER",
  },
  {
    title: "Train to SALAMANCA",
    startTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 500 * 60 * 1000),
    endTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 610 * 60 * 1000),
    location: "MADRID-CHAMARTÍN-CLARA CA",
  },
];

//=====================================================================================================
//!!!!!!!!!!!!!!!! DO NOT EDIT BELOW HERE UNLESS YOU REALLY KNOW WHAT YOU'RE DOING !!!!!!!!!!!!!!!!!!!!
//=====================================================================================================

/**
 * Create test suite with testData
 */
function createTestEvents() {
  var testData = [];

  switch (testSuiteChosen) {
    case 1:
      testData = testSimpleTrip;
      break;
    case 2:
      testData = testContinuousStaysShortTrip;
      break;
    case 3:
      testData = testContinuousStaysLongTrip;
      break;
    case 4:
      testData = testOverlappingStays;
      break;
    default:
      break;
  }

  for (var testIndex in testData) {
    let test = testData[testIndex];
    sourceCalendar.createEvent(test.title, test.startTime, test.endTime, {
      location: test.location,
      description: descriptionTest,
    });
  }

  Logger.log("  - Creating test suite");
}

/**
 * Create test suite with testData
 */
function cleanTestEvents() {
  let now = new Date();
  let oneMonthFromNow = new Date(now.getTime() + 1 * 30 * 24 * 60 * 60 * 1000);

  let events = sourceCalendar.getEvents(now, oneMonthFromNow);
  let stays = targetCalendar.getEvents(now, oneMonthFromNow);

  // Check if events or stays exist
  if (events.length || stays.length) {
    for (var eventIndex in events) {
      let tripEndTime = sourceCalendar.getEventById(events[eventIndex].getId()).getEndTime();

      for (var staysIndex in stays) {
        let stayStartTime = targetCalendar.getEventById(stays[staysIndex].getId()).getStartTime();
        let timeDifference = (stayStartTime - tripEndTime) / 60000;

        // Delete stay if difference is less than 1 min
        if (timeDifference < 1 && -1 < timeDifference) {
          stays[staysIndex].deleteEvent();
        }
      }

      // Delete trip if test-description matches
      if (events[eventIndex].getDescription() === descriptionTest) {
        events[eventIndex].deleteEvent();
      }
    }

    Logger.log("  - Cleaning test suite");
  } else {
    Logger.log("  - [ERROR] Cleaning test suite could not get events on Source or Target Calendar");
  }
}

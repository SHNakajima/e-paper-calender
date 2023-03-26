const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});

  const calendars = await (await calendar.calendarList.list()).data;
  const calendarColors = await (await calendar.colors.get()).data;
  console.log(calendarColors);

  const displayCalendars = ["共有"];

  calendars.items.forEach(cl => {
    if ( displayCalendars.includes(cl.summary) ) {
      console.log(cl);
      getEventsList(cl, calendar);
    }
  });

  // const res = await calendar.events.list({
  //   calendarId: 'primary',
  //   timeMin: new Date().toISOString(),
  //   maxResults: 10,
  //   singleEvents: true,
  //   orderBy: 'startTime',
  // });
  // const events = res.data.items;
  // if (!events || events.length === 0) {
  //   console.log('No upcoming events found.');
  //   return;
  // }
  // console.log('Upcoming 10 events:');
  // events.map((event, i) => {
  //   const start = event.start.dateTime || event.start.date;
  //   console.log(`${start} - ${event.summary}`);
  // });
}

async function getEventsList(calendar, gclObj) {
  const res = await gclObj.events.list({
    calendarId: calendar.id,
    timeMin: new Date().toISOString(),
    maxResults: 30,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: getCurMonthRange('start'),
    timeMax: getCurMonthRange('end')
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  console.log('Upcoming 30 events:');
  events.map((event, i) => {
    mapEvent(event);
  });
  console.log(events);
}

function mapEvent(event) {
  const startDay = (event.start.dateTime || event.start.date).substring(0,10);
  event.startDay = startDay;

  return event;
}

function getCurMonthRange(target) {
  var date = new Date();
  if (target == 'start') {
    return new Date(date.getFullYear(), date.getMonth(), -7);
  } else {
    return new Date(date.getFullYear(), date.getMonth() + 1, 9);
  }
}

// authorize().then(listEvents).catch(console.error);

exports.getEvents =  async function() {
  try {
    const auth = await authorize();
    return await listEvents(auth);
  } catch (message) {
    return console.error(message);
  }
}
const express = require("express");

const app = express();

const { google } = require("googleapis");

const axios = require("axios");

require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:5000/rest/v1/calendar/redirect/"
);

app.get("/rest/v1/calendar/init/", async (req, res) => {
  try {
    const scopes = ["https://www.googleapis.com/auth/calendar"];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      include_granted_scopes: true,
    });

    res.redirect(301, authorizationUrl);
  } catch (error) {
    console.log(error);
    res.status(400).send({ msg: "Error Occured", err: error });
  }
});

app.get("/rest/v1/calendar/redirect/", async (req, res) => {
  try {
    const code = req.query.code;

    let value = {
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: "http://localhost:5000/rest/v1/calendar/redirect/",
      grant_type: "authorization_code",
    };

    let param = new URLSearchParams(value)

    let token = await axios.post("https://oauth2.googleapis.com/token", param.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    oauth2Client.setCredentials(token.data);

    const calendar = google.calendar({ version: "v3" });

    const result = await calendar.events.list({
      auth: oauth2Client,
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.send(result.data.items);
  } catch (error) {
    console.log(error);
    res.status(400).send({ msg: "Error Occured", err: error });
  }
});

app.listen(5000, () => {
  console.log("Server is listening at port 5000");
});

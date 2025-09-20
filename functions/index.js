const functions = require("firebase-functions");

// A simple test function to verify your setup.
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase! Your cloud function setup is working.");
});
// <-- Make sure there is a blank line after this closing bracket
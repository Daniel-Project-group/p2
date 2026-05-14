// The cookie must only contain one thing - which is a sesion id
// That session id is tethered to a specific user

// Code for actually tethering session id to info
// Example for now
/*sessions.set(sessionId, {
    username: "anton",
    email: "anton@example.com"
});*/

// Imports
const express = require('express');
const router = express.Router();

// Now we mount all files within auth, since they are never required from server.js
const loginRoute = require('./loginRoute');
const signupRoute = require('./signupRoute');
const logoutRoute = require('./logoutRoute');

router.use('login', loginRoute);
router.use('signup', signupRoute);
router.use('logout',logoutRoute);

module.exports = router;
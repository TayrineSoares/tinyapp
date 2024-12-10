const express = require('express');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const SALT_ROUNDS = 10;

const { userLookup, generateRandomString } = require('./helpers');

const app = express();
const PORT = 8080;

// ----------MIDDLEWARE--------------
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['detergente'],

  //Optional parameter: how long is the cookie valid for?
  maxAge: 24 * 60 * 60 * 1000
}));


// ----------URL DATABASE --------------
const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userId: null
  },

  '9sm5xK': {
    longURL: 'http://www.google.com',
    userId: null
  }
};

// ----------USERS DATABASE --------------
const usersDatabase = {};

// ------ SERVER CONNECTION ---------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//----------- GENERAL ROUTES ---------------------

app.get('/', (req, res) => {
  res.redirect('login');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});


//----------- REGISTER ROUTES ---------------------

app.get('/register', (req, res) => {

  const userId = req.session['userId'];

  // If already logged in, redirect to "urls"
  if (userId) {
    return res.redirect('/urls');
  }

  const templateVars = { user: null };
  res.render('register', templateVars);
});


app.post('/register', (req, res) => {

  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  //Check if user already exists 
  const existingUser = userLookup(email, usersDatabase);
  if (existingUser) {
    return res.status(400).send("Email is already registered.");
  }

  // If doesnt exist, create user and generate new Id.
  const userId = generateRandomString(urlDatabase);

  //hash password
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // Add the new user to the users object
  usersDatabase[userId] = {
    id: userId,
    email: email,
    password: hashedPassword // hashed password instead of text
  }

  // Set a cookie with the new user's ID
  req.session.userId = userId;
  res.redirect('/login');
});


//----------- LOGIN ROUTES ---------------------

app.get('/login', (req, res) => {
  const userId = req.session['userId'];

  // If already logged in
  if (userId) {
    return res.redirect('/urls');
  }

  // If not logged in
  const templateVars = { user: null };
  res.render('login', templateVars);

});

app.post('/login', (req, res) => {

  const { email, password } = req.body;

  //Check if user already exists 
  const existingUser = userLookup(email, usersDatabase);
  if (!existingUser) {
    return res.status(403).send("Email is not registered or is incorrect.");
  }

  //Check if password matches
  const user = usersDatabase[existingUser];

  // Compare the entered password (req.body.password) with the HASHED password stored in user.password in the Registration route
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password is incorrect.");
  }

  req.session.userId = existingUser;
  res.redirect('/urls');

});


//----------- URLS ROUTES ---------------------

app.get('/urls', (req, res) => {
  const userId = req.session['userId'];

  // Check if the user is logged in
  if (!userId) {
    return res.send("<html>You need to log in to view your URLs.</html>");
  };

  const user = usersDatabase[userId]; // The new user object including id, email and password 

  // Filter URLs belonging to the logged-in user
  const userUrls = {};
  for (const id in urlDatabase) {
    const url = urlDatabase[id];
    if (url.userId === userId) {
      userUrls[id] = url;
    }
  };

  const templateVars = {
    user: user,
    urls: userUrls
  };
  res.render('urls_index', templateVars);
});


app.get('/urls/new', (req, res) => {
  const userId = req.session['userId'];

  // If NOT logged in
  if (!userId) {
    return res.redirect('/login');
  }

  const user = usersDatabase[userId];
  const templateVars = { user: user };

  res.render('urls_new', templateVars);
});


app.post('/urls', (req, res) => {
  const userId = req.session['userId'];

  // If NOT logged in
  if (!userId) {
    return res.send("<html><body>You need to login to use this feature.</b></body></html>\n");
  }

  // Log the POST request (submission form from "new") body to the console
  console.log("Long URL sent in the form", req.body);

  // URL inserted on the form
  const longURL = req.body.longURL;

  // Check if longURL is provided
  if (!longURL || longURL.trim() === "") {
    return res.status(400).send("Error: Please provide a valid URL");
  }

  const id = generateRandomString(urlDatabase);

  // adds new info (key pair value) to urlDatabase object
  urlDatabase[id] = {
    longURL: longURL,
    userId: userId // Associate with logged in user
  }

  res.redirect(`/urls/${id}`);
});


app.get('/urls/:id', (req, res) => {
  const userId = req.session['userId'];
  const user = usersDatabase[userId];
  const urlData = urlDatabase[req.params.id];

  // Check if the user is logged in
  if (!userId) {
    return res.send("<html>You need to log in to view this URL.</html>");
  };

  // Check if the URL exists and if the user owns the URL
  if (!urlData) {
    return res.status(404).send("<html>The provided URL does not exist.</html>");
  }

  if (urlData.userId !== userId) {
    return res.status(403).send("<html>You do not have permission to view this URL.</html>");
  }

  const templateVars = {
    user: user,
    id: req.params.id, // Extract the URL ID from the request
    longURL: urlData.longURL
  };

  res.render('urls_show', templateVars);
});


app.get('/u/:id', (req, res) => {
  const urlData = urlDatabase[req.params.id];

  if (!urlData) {
    return res.status(404).send("Short URL not found.");
  }

  res.redirect(urlData.longURL);
});


//POST route for edit button 
app.post('/urls/:id', (req, res) => {

  const userId = req.session['userId'];
  const urlData = urlDatabase[req.params.id];

  if (!userId) {
    return res.send("<html>You need to log in to edit this URL.</html>");
  };

  if (!urlData) {
    return res.send("<html>Error: URL does not exist.</html>");
  }

  if (urlData.userId !== userId) {
    return res.status(403).send("<html>You cannot edit this URL.</html>");
  }

  //Update the URL 
  urlData.longURL = req.body.newURL;

  res.redirect(`/urls/${req.params.id}`);
});


//`POST` route that removes a URL resource and redirect the client back to the 'urls_index' page 
app.post('/urls/:id/delete', (req, res) => {
  const userId = req.session['userId'];
  const urlData = urlDatabase[req.params.id];

  // Check if user is logged in
  if (!userId) {
    return res.send("<html>You need to log in to delete this URL.</html>");
  };

  // Check if  user owns the URL
  if (urlData.userId !== userId) {
    return res.send("<html>You do not have permission to delete this URL.</html>");
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});


//----------- LOGOUT ROUTES ---------------------
app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/login');
});


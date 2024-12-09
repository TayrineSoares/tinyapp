const express = require('express');

const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const app = express(); 
const PORT = 8080; //Default port 8080


// ----------MIDDLEWARE--------------
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session', // can be any name, will NOT affect the code. It becomes the name of the cookie inside the browser

  keys: ['detergente'], // ARRAY with any string. This the key that is used to encrypt and decrypt the cookies. We want to keep this secret. 

  //Optional parameter: how long is the cookie valid for?
  maxAge: 24 * 60 * 60 * 1000 // this number = 24 hours
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
const users = {};


// ------ SERVER CONNECTION ---------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// --------HELPER FUNCTIONS -----------------
// userLookup helper function to find registered users 
const userLookup = function(userEmail) {
  for (const userId in users) {
    if (users[userId].email === userEmail) {
      return userId; 
    }
  }
  return null; 
};

//// Generate a random string of length 6
const generateRandomString = function() {

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length); 
      result += characters[randomIndex];
  }
  
  if (!urlDatabase[result]) {
      return result;
  
  } else {
      return generateRandomString();
  }
};

//----------- GENERAL ROUTES ---------------------

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});


//----------- LOGIN ROUTES ---------------------
// GET /login endpoint that responds with a login form template
app.get('/login', (req, res) => {
  const userId = req.session['userId']; // retrieve info from cookies

  // If already logged in, redirect to "urls"
  if (userId) {
   return res.redirect('/urls');
  }

  // If not logged in, render login page 
  const templateVars = { user: null }; // No user data if not logged in
  res.render('login', templateVars);

});

app.post('/login', (req, res) => {

  const { email, password } = req.body; 

  //Check if user already exists 
  const existingUser = userLookup(email); 
  if (!existingUser) { // checks if the return of userLookup is truthy
    return res.status(403).send("Email is not registered or is incorrect.");
  }

  //Check if password matches
  const user = users[existingUser];

  // Compare the entered password (req.body.password) with the HASHED password stored in user.password in the Registration route
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password is incorrect.");
  } 

  // res.cookie("userId", existingUser);
  req.session.userId = existingUser; // switching to encrypted cookies
  res.redirect('/urls');

});


//----------- URLS ROUTES ---------------------
app.get('/urls', (req, res) => {
  const userId = req.session['userId'];

  // Check if the user is logged in
  if (!userId) {
    return res.send("<html>You need to log in to view your URLs.</html>");
  };

  const user = users[userId]; // The new user object includin id, email and password 
  //console.log(user);

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

   // If NOT logged in, send a message
   if (!userId) {
    return res.send("<html>You need to log in to create an URL.</html>");
   }

  const user = users[userId]; 
  const templateVars = { user: user }; 

  res.render('urls_new', templateVars);
});


app.post('/urls', (req, res) => {
  const userId = req.session['userId']; 

  // If NOT logged in, send a message
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

  const id = generateRandomString();

  // adds new info (key pair value) to urlDatabase object
  urlDatabase[id] = {
    longURL: longURL,
    userId: userId // Associate with logged in user
  } 

  //Log the updated urlDatabase (for debugging)
  console.log("Updated urlDatabase", urlDatabase);

  res.redirect(`/urls/${id}`);
});


app.get('/urls/:id', (req, res) => {
  const userId = req.session['userId'];
  const user = users[userId]; // Find the user object
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

   // Render the 'urls_show' view and pass the template variables
  res.render('urls_show', templateVars);
});


app.get('/u/:id', (req, res) => {
  const urlData = urlDatabase[req.params.id];

  if (!urlData) {
    return res.status(404).send("Short URL not found.");
  }

  res.redirect(urlData.longURL);
});


//POST route for edit button that redirects the client back to the 'urls_index' page and updates the URL
app.post('/urls/:id', (req, res) => {
  // const userId = req.cookies["userId"];
  const userId = req.session['userId']; // switched to req.session to use encrypted cookies
  const urlData = urlDatabase[req.params.id];

  // Check if the user is logged in
  if (!userId) {
    return res.send("<html>You need to log in to edit this URL.</html>");
  };

  if (!urlData) {
    return res.status(404).send("Error: URL does not exist.");
  }

  if (urlData.userId !== userId) {
    return res.status(403).send("You cannot edit this URL.");
  }

  //Update the URL 
  urlDatabase[req.params.id].longURL = req.body.newURL;

  res.redirect(`/urls/${id}`);
});


//`POST` route that removes a URL resource and redirect the client back to the 'urls_index' page 
app.post('/urls/:id/delete', (req, res) => {
  const userId = req.session['userId']; // Get the userID from cookies
  const urlData = urlDatabase[req.params.id]; // Get the URL from the database using the ID

  // Check if user is logged in
  if (!userId) {
    return res.send("<html>You need to log in to delete this URL.</html>");
  };

  // Check if  user owns the URL
  if (urlData.userId !== userId) {
    return res.send("<html>You do not have permission to delete this URL.</html>");
  }

  // Delete the URL if the user is the owner
  delete urlDatabase[req.params.id];

  res.redirect('/urls');
});


//----------- LOGOUT ROUTES ---------------------
app.post('/logout', (req, res) => {
  
  // res.clearCookie('userId');
  req.session = null; //clear the whole req.session object, clears all cookies
  res.redirect('/login');
});


//----------- REGISTER ROUTES ---------------------
//  GET /register endpoint, which returns the template register.ejs
app.get('/register', (req, res) => {
  
  const userId = req.session['userId']; // retrieve info from cookies

  // If already logged in, redirect to "urls"
  if (userId) {
   return res.redirect('/urls');
  }

  // If not logged in, render register page 
  const templateVars = { user: null }; // No user data if not logged in
  res.render('register', templateVars);
});


// POST/register endpoint. Add a new user object to the global users object. The user object should include the user's id, email and password. 
app.post('/register', (req, res) => {
  // const email = req.body.email 
  // const password = req.body.password
  const { email, password } = req.body; 

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  //Check if user already exists 
  const existingUser = userLookup(email); 
    if (existingUser) { // checks if the return of userLookup is truthy
      return res.status(400).send("Email is already registered.");
    }
  
  // If doesnt exist, create user and generate new Id. 
  const userId = generateRandomString();

  //hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Add the new user to the users object
  users[userId] = {
    id: userId, 
    email: email,
    password: hashedPassword // hashed password instead of text
  }
  
  // for debugging
  console.log("Users after registration:", users);

  // Set a cookie with the new user's ID
  // res.cookie('userId', userId);
  req.session.userId = existingUser; // switching to encrypted cookies
  res.redirect('/login');
});


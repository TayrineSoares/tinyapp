const express = require('express');
const cookieParser = require('cookie-parser');

const app = express(); 
const PORT = 8080; //Default port 8080



// ----------MIDDLEWARE--------------
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ----------URL DATABASE --------------
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// ----------URL DATABASE --------------
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "2",
  },
};

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


//----------- ROUTES ---------------------

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//----------- URLS ROUTES ---------------------
app.get("/urls", (req, res) => {
  const userId = req.cookies["userId"];
  const user = users[userId]; // The new user object includin id, email and password 
  //console.log(user);

  const templateVars = { 
    user: user,
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userId = req.cookies["userId"]; 

   // If NOT logged in, redirect to "urls"
   if (!userId) {
    return res.redirect("/login");
   }

  const user = users[userId]; 
  const templateVars = { user: user }; 

  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  const userId = req.cookies["userId"]; 

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

  // generate an Id for the submitted url (the Id will be the short URL)
  const id = generateRandomString();

  // adds new info (key pair value) to urlDatabase object
  urlDatabase[id] = longURL;

  //Log the updated urlDatabase (for debugging)
  console.log("Updated urlDatabase", urlDatabase);

  // Redirect to the new short URL page (/urls/:id)
  res.redirect(`/urls/${id}`);
});


app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["userId"];
  const user = users[userId]; // Find the user object

  const templateVars = { 
    user: user,
    id: req.params.id, // Extract the URL ID from the request
    longURL: urlDatabase[req.params.id] 
  };

   // Render the 'urls_show' view and pass the template variables
  res.render("urls_show", templateVars);
});


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]; // Get the corresponding long URL from the database

  if (!longURL) {
    return res.status(404).send('Short URL not found');
  }
  res.redirect(longURL);
});


//`POST` route that removes a URL resource and redirect the client back to the 'urls_index' page 
app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("Error: URL does not exist.");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls")
});

//POST route for edit button that redirects the client back to the 'urls_index' page and updates the URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("Error: URL does not exist.");
  }

  //Update the URL 
  const newUrl = req.body.newURL;
  urlDatabase[id] = newUrl;

  res.redirect(`/urls/${id}`);
});


//----------- LOGIN ROUTES ---------------------
// GET /login endpoint that responds with a login form template
app.get('/login', (req, res) => {
  const userId = req.cookies["userId"]; // retrieve info from cookies

  // If already logged in, redirect to "urls"
  if (userId) {
   return res.redirect("/urls");
  }

  // If not logged in, render login page 
  const templateVars = { user: null }; // No user data if not logged in
  res.render('login', templateVars);

});


app.post("/login", (req, res) => {

  const { email, password } = req.body; 

  //Check if user already exists 
  const existingUser = userLookup(email); 
  if (!existingUser) { // checks if the return of userLookup is truthy
    return res.status(403).send("Email is not registered or is incorrect.");
  }

  //Check if password matches
  const user = users[existingUser];
  if (user.password !== password) {
    return res.status(403).send("Password is incorrect.");
  }

  res.cookie("userId", existingUser);
  res.redirect("/urls");


});

// If already logged in, redirect to "urls"





//----------- LOGOUT ROUTES ---------------------
app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.redirect('/login');
});


//----------- REGISTER ROUTES ---------------------
//  GET /register endpoint, which returns the template register.ejs
app.get('/register', (req, res) => {
  const userId = req.cookies["userId"]; // retrieve info from cookies

  // If already logged in, redirect to "urls"
  if (userId) {
   return res.redirect("/urls");
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

  // Add the new user to the users object
  users[userId] = {
    id: userId, 
    email: email,
    password: password
  }
  
  // Set a cookie with the new user's ID
  res.cookie('userId', userId);

  res.redirect('/urls');
});







const express = require('express');
const app = express(); 
const PORT = 8080; //Default port 8080


const generateRandomString = function() {

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length); 
    result += characters[randomIndex];
  }
  return result;
};


app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {

  // Check if longURL is provided
  if (!longURL || longURL.trim() === '') {
    return res.status(400).send('Error: Please provide a valid URL');
  }

   // Log the POST request body to the console
  console.log("Long URL sent in the form", req.body);
  
  // URL inserted on the form
  const longURL = req.body.longURL;

  // generate an Id for the submitted url (the Id will be the short URL)
  const id = generateRandomString();
  
  // adds new info (key pair value) to urlDatabase object
  urlDatabase[id] = longURL;
  
  //Log the updated urlDatabase (for debugging)
  console.log("Updated urlDatabase", urlDatabase);

  // Redirect to the new short URL page (/urls/:id)
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id; 
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});


app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, // Extract the URL ID from the request
    longURL: urlDatabase[req.params.id] // Get the corresponding long URL from the database
  };

   // Render the 'urls_show' view and pass the template variables
  res.render("urls_show", templateVars);
});


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];

  // If the short URL doesn't exist, send a 404 error
  if (!longURL) {
    return res.status(404).send('Short URL not found');
  }
  res.redirect(longURL);
});
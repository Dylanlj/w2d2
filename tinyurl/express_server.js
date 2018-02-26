const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const express = require("express");
const PORT = process.env.PORT || 8080;
const bcrypt = require("bcrypt");
const methodOverride = require("method-override")

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"))
app.use(cookieSession({
  name: "session",
  keys: ["szvszd"],
}))

let urlDatabase = {
  "b2xVn2" : {
   longURL: "http://www.lighthouselabs.ca",
   userID: "fhsueo",
   timesVisited: 0
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: "user2RandomID",
    timesVisited: 0
  }
}

const users = { 
  "fhsueo": {
    id: "fhsueo", 
    email: "craig@example.com", 
    password: "dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect("http://localhost:8080/urls");
  }
  res.redirect("http://localhost:8080/login");
})

//brings up urls new page 
app.get("/urls/new", (req,res) => {
  if(req.session["user_id"]){
    let templateVars = {user_id: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
})

app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect("http://localhost:8080/urls");
  }
  let templateVars = {
    user: req.session.user_id,
    error: ""
  };
  res.render("urls_login", templateVars);
})

//clears cookie on logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("http://localhost:8080/urls");
})

//redirects the client using the shortURLs longURL site
app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL)
  if(urlDatabase[req.params.shortURL]) {
    urlDatabase[req.params.shortURL].timesVisited += 1;
    res.redirect(urlDatabase[req.params.shortURL].longURL);  
  } else {
    res.status(404).send("incorrect short URL");    
  }
})

//urls page, index
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user_id: users[req.session.user_id]
  }     
  res.render("urls_index", templateVars);
})

//registers new users page
app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  }
  let templateVars = {
    user_id: users[req.session.user_id],
    error: ""
  }
  res.render("urls_register.ejs", templateVars);
})

//short URL webpage for editing, provides page with long and short URLS
app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.status(404).send("the url you are trying to access does not exist")
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user_id: users[req.session.user_id],
      error: undefined,
      visits: urlDatabase[req.params.id].timesVisited
    }
    if(!req.session.user_id){
  //they are not logged in
      templateVars.error = "You need to sign in to see urls";
    } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
      res.status(403).send("You don't have permission to view this url");
    }
    res.render("urls_show", templateVars);
  }
})

//generates a random short url for the given long url and then directs to the short url page
app.post("/urls", (req, res) => {
  if(!req.session.user_id){
    res.status(403).send("You need to login");
  } else if(req.body.longURL){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].timesVisited = 0;
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    res.redirect(302, `http://localhost:8080/urls/${shortURL}`); 
  } 
})

//registering a new user
app.post("/register", (req, res) => {
  let templateVars = {error: ""}
  for (let idKey in users){
    if(users[idKey].email === req.body.email){
      templateVars.error = "This email is already being used";
    res.status(400).render("urls_register.ejs", templateVars);
    }
  }
//user didn't put in an email or password
  if(!req.body.email || !req.body.password ){
    templateVars.error = "You forgot an email or password";
    res.status(400).render("urls_register.ejs", templateVars);
  } else {
    let randomString = generateRandomString();
    users[randomString] = {};
    users[randomString].id = randomString;  
    users[randomString].email = req.body.email;
    users[randomString].password = bcrypt.hashSync(req.body.password, 10);
    req.session.user_id = randomString;
    res.redirect("http://localhost:8080/urls");
  }
})

//receives login email and password
app.post("/login", (req, res) => {
  let templateVars = {error: ""}
  for(let userID in users){
    if (users[userID].email === req.body.email) {
      if(bcrypt.compareSync(req.body.password, users[userID].password)){
        req.session.user_id = userID;
        res.redirect("http://localhost:8080/urls");
      } else {
        templateVars.error = "invalid password";       
        res.render("urls_login", templateVars);
      }
    }
  }
  templateVars.error = "invalid email";
  res.render("urls_login", templateVars);
})

//updates a long URL i want to change this so it redirects to the index page instead of refreshing
app.put("/urls/:id", (req, res) => {
  if(!req.session.user_id){
    res.status(403).send("You need to login");
  } else if(req.session.user_id === urlDatabase[req.params.id].userID){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user_id: users[req.session.user_id]
    }
    res.redirect("http://localhost:8080/urls");
  }
})

//deleting a url resource 
app.delete("/urls/:id/delete", (req, res) => {
    if(!req.session.user_id){
    res.status(403).send("You need to login");
  } else if(req.session.user_id === urlDatabase[req.params.id].userID){
    delete urlDatabase[req.params.id];
  }
  res.redirect("http://localhost:8080/urls");
})

//returns the urlDatabase with only the urls that belong to the user
function urlsForUser (userCookieID){
  let applicableURLS = {};
  for(let shortURLS in urlDatabase){
    if(userCookieID === urlDatabase[shortURLS].userID){
      applicableURLS[shortURLS] = urlDatabase[shortURLS];
    }
  }
  return applicableURLS;
} 

function generateRandomString(){
  let characters = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let randomString = "";
  for(var i = 1; i < 7; i++){
    let randomNum = Math.floor((Math.random() * 61));
    randomString += characters[randomNum];
  }
  return randomString;
}

//tells you if the server is running and listening for client requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})

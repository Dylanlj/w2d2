const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const express = require("express");
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: "session",
  keys: ["szvszd"],
}))

let urlDatabase = {
  "b2xVn2" : {
   longURL: "http://www.lighthouselabs.ca",
   userID:"fhsueo"
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: "user2RandomID"
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
    res.status(302).redirect("http://localhost:8080/urls")
  }
  res.status(302).redirect("http://localhost:8080/login")
})

//brings up urls new page i don"t think sending templatevars is doing anything
app.get("/urls/new", (req,res) => {
  if(req.session["user_id"]){
      let templateVars = {user_id: users[req.session.user_id]}
      res.render("urls_new", templateVars);
  } else {
    res.status(403).redirect("http://localhost:8080/login")
  }
})

//updates a long URL i want to change this so it redirects to the index page instead of refreshing
app.post("/urls/:id", (req, res) => {
  if(req.session.user_id === urlDatabase[req.params.id].userID){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    let templateVars = {shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id].longURL,
                        user_id: users[req.session.user_id]};
    res.status(302).redirect("http://localhost:8080/urls");
  }
})


//receives login email and password
app.post("/login", (req, res) => {
  for(let userID in users){
      if (users[userID].email === req.body.email) {
        if(bcrypt.compareSync(req.body.password, users[userID].password)){
          req.session.user_id = userID;
          res.redirect("http://localhost:8080/urls")
        } else {
//incorrect password add this message          
          res.status(403).redirect("http://localhost:8080/")
        }
      }
  }
//incorrect email add this message
  res.status(403).redirect("http://localhost:8080/")
})

//login page sloppy coding with the current user and login page, fix last
app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect("http://localhost:8080/urls")
  }

  let currentUser = req.session.user_id ; 

  let templateVars = {user: currentUser};
  res.render("urls_login", templateVars);
})



//clears cookie on logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("http://localhost:8080/urls");

})


//urls page, index
app.get("/urls", (req, res) => {
 let templateVars = {urls: urlsForUser(req.session.user_id),
                    user_id: users[req.session.user_id] };       
  res.render("urls_index", templateVars);
})

//generates a random short url for the given long url and then directs to the short url page
//should probably come up with an else statement telling them they didnt enter anything
app.post("/urls", (req, res) => {
  if(req.body.longURL){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    console.log(urlDatabase[shortURL])
    res.redirect(302, `http://localhost:8080/urls/${shortURL}`); 
  } 
})

//registers new users page
app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  }
  let templateVars = {user_id: users[req.session.user_id],
                      error: ""};
  res.render("urls_register.ejs", templateVars);
})

//registering a new user
app.post("/register", (req, res) => {
// you may be able to do this more efficiently with a for loop, come back to it at the end
// user is already registered  
  let templateVars = {error: ""}
  for (let idKey in users){
    if(users[idKey].email === req.body.email){
      templateVars.error = "This email is already being used"
    res.status(400).render("urls_register.ejs", templateVars)
    }
  }
//user didn't put in an email or password
  if(!req.body.email || !req.body.password ){
    templateVars.error = "You forgot an email or password"
  res.status(400).render("urls_register.ejs", templateVars)
  } 
  let randomString = generateRandomString();
  users[randomString] = {};
  users[randomString].id = randomString;  
  users[randomString].email = req.body.email;
  users[randomString].password = bcrypt.hashSync(req.body.password, 10);
  req.session.user_id = randomString;
  res.redirect("http://localhost:8080/urls");
})



//short URL webpage for editing and such, provides page with long and short URLS
app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    let templateVars = {
      error: "the url you are trying to access does not exist",
      user_id: users[req.session.user_id]
    }
    res.render("urls_show", templateVars)
  } else {

  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user_id: users[req.session.user_id],
    error: undefined
  };


        
      if(!req.session.user_id){
        //they are not logged in
        templateVars.error = "You need to sign in to see urls";
        res.render("urls_show", templateVars)

      } else if (urlDatabase[req.params.id].userID === req.session.user_id){
        //the url belongs to this owner/cookie/id
        res.render("urls_show", templateVars);
      }
//the URL is real but you don't have permission
      templateVars.error = "You don't have permission to view this url" ;
      res.render("urls_show", templateVars);
    }
})

//deleting a url resource 
app.post("/urls/:id/delete", (req, res) => {
  if(req.session.user_id === urlDatabase[req.params.id].userID){
    delete urlDatabase[req.params.id]
  }
  res.redirect("http://localhost:8080/urls");
})


//tells you if the server is running and listening for client requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})

//figure it out yourself
function generateRandomString(){
  let characters = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let randomString = "";
  for(var i = 1; i < 7; i++){
    let randomNum = Math.floor((Math.random() * 61))
    randomString += characters[randomNum];
  }
  return randomString;
}

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

//redirects the client using the shortURLs longURL site
app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]) {
    res.redirect(302, urlDatabase[req.params.shortURL].longURL);
  } else {
    res.status(302).send("incorrect short URL");
  }
})
// trying to go to urls/:id with an invalid short URL doesn't give the proper error message
//at /urls if the user is not logged in returns HTML with a relevant error message
//the users in here won't login properly becuase you set up their passwords nad the bcrypt 
//can't seem to make it to the urls page urls_index.ejs with a new user
// you"re very inconsistent with " and "", pick one stupid
//gotta bug check all your error messages, should also ask how the best way to handle them is
//come up with a way to implement error messages later res.status(400).render("urls_register.ejs", {error: "this is an error" })
//repetitive for loops, fix later
//i feel like i'm generating a lot of http errors unnecessarily but maybe its supposed to be like that, maybe if you dont add the error code?
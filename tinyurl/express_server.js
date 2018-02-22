const bodyParser = require("body-parser");
let express = require("express");
let PORT = process.env.PORT || 8080;
let cookieParser = require("cookie-parser")
let app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

let urlDatabase = {
  "b2xVn2" : {
   longURL: "http://www.lighthouselabs.ca",
   userID:"fhsueo"
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: "user2RandomID"
  }
};

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
  res.end("Hello!")
})

//brings up urls new page i don"t think sending templatevars is doing anything
app.get("/urls/new", (req,res) => {

  if(req.cookies["user_id"]){
      let templateVars = {user_id: users[req.cookies["user_id"]]}
      res.render("urls_new", templateVars);
  } else {
    res.redirect("http://localhost:8080/login")
  }
  


});



//updates a long URL i want to change this so it redirects to the index page instead of refreshing
app.post("/urls/:id", (req, res) => {
  if(req.cookies["user_id"] === urlDatabase[req.params.id].userID){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    let templateVars = {shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id].longURL,
                        user_id: users[req.cookies["user_id"]]};
    res.render("urls_show", templateVars);
  }
})


//receives login email and password
app.post("/login", (req, res) => {
  for(let userID in users){
      if (users[userID].email === req.body.email) {
        if(users[userID].password === req.body.password){
          res.cookie("user_id", userID)
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
  let currentUser = "";
  if(req.headers.cookie){
    currentUser = req.headers.cookie.user_id ; 
  }
  let templateVars = {user: currentUser};
  res.render("urls_login", templateVars)
})

//clears cookie on logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("http://localhost:8080/urls")
})

//urls page, index
app.get("/urls", (req, res) => {
 let templateVars = {urls: urlsForUser(req.cookies["user_id"]),
                    user_id: users[req.cookies["user_id"]] }              
  res.render("urls_index", templateVars);
})

//generates a random short url for the given long url and then directs to the short url page
//should probably come up with an else statement telling them they didnt enter anything
app.post("/urls", (req, res) => {
  if(req.body.longURL){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.cookies["user_id"];

    res.redirect(302, `http://localhost:8080/urls/${shortURL}`); 
  } 
})

//registers new users page
app.get("/register", (req, res) => {
  let templateVars = {user_id: users[req.cookies["user_id"]]};
  res.render("urls_register.ejs", templateVars)
})

//registering a new user
app.post("/register", (req, res) => {
// you may be able to do this more efficiently with a for loop, come back to it at the end
  for (let idKey in users){
    if(users[idKey].email === req.body.email){
    res.status(400).render("urls_register.ejs")
    }
  };
  if(!req.body.email || !req.body.password ){
  res.status(400).render("urls_register.ejs")
  } 

  let randomString = generateRandomString()
  users[randomString] = {};
  users[randomString].id = randomString;  
  users[randomString].email = req.body.email;
  users[randomString]["password"] = req.body.password;
  res.cookie("user_id", randomString);
  res.redirect("http://localhost:8080/urls");
  
})



//short URL webpage for editing and such, provides page with long and short URLS
app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id].longURL,
                      user_id: users[req.cookies["user_id"]]
                      };
//checks for if the url exists
  for(let urls in urlDatabase){
    if(req.params.id === urls){

      if(!req.cookies["user_id"]){
        //they're not logged in  
        res.redirect("http://localhost:8080/login")
      } else if (urlDatabase[urls].userID === req.cookies["user_id"]){
        //the cookie matches the url owner
        res.render("urls_show", templateVars);
      }
      templateVars.user_id = undefined;
      res.render("urls_show", templateVars);
    }
  } 

//tell the user this is not a valid address
  res.redirect(404,"http://localhost:8080/urls")
});




//deleting a url resource 
app.post("/urls/:id/delete", (req, res) => {
  if(req.cookies["user_id"] === urlDatabase[req.params.id].userID){
    delete urlDatabase[req.params.id]
  }
  res.redirect("http://localhost:8080/urls")
})




//tells you if the server is running and listening for client requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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
  return applicableURLS
} 

//redirects the client using the shortURLs longURL site
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]){
    res.status(302).send("incorrect short URL");
  }
  res.redirect(302, urlDatabase[req.params.shortURL]);
});



// you"re very inconsistent with " and "", pick one stupid
//gotta bug check all your error messages, should also ask how the best way to handle them is
//come up with a way to implement error messages later res.status(400).render("urls_register.ejs", {error: "this is an error" })
//repetitive for loops, fix later
//i feel like i'm generating a lot of http errors unnecessarily but maybe its supposed to be like that, maybe if you dont add the error code?
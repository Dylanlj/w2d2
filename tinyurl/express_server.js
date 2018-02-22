const bodyParser = require("body-parser");
let express = require("express");
let PORT = process.env.PORT || 8080;
let cookieParser = require("cookie-parser")
let app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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



//updates a long URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      user_id: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
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
 let templateVars = {urls: urlDatabase,
                    user_id: users[req.cookies["user_id"]] }
  res.render("urls_index", templateVars);
})

//i believe this receives the req and res from urls_new.ejs as post request
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
//this effectively sends the client to urls_show.ejs
  res.redirect(302, `http://localhost:8080/urls/${shortURL}`);
})

//registers new users 
app.get("/register", (req, res) => {
  let templateVars = {user_id: users[req.cookies["user_id"]]};
  res.render("urls_register.ejs", templateVars)
})

app.post("/register", (req, res) => {
// you may be able to do this more efficiently with a for loop, come back to it at the end
  for (let idKey in users){
    if(users[idKey].email === req.body.email){
    console.log(users)
    res.status(400).render("urls_register.ejs")
    }
  }

  if(!req.body.email || !req.body.password ){
  res.status(400).render("urls_register.ejs")
  } 

  let randomString = generateRandomString()
  users[randomString] = {};
  users[randomString].id = randomString;  
  users[randomString].email = req.body.email;
  users[randomString]["password"] = req.body.password;
  res.cookie("user_id", randomString);
  console.log(users)
  res.redirect("http://localhost:8080/urls");
  

})

//provides page with long and short URLS
app.get("/urls/:id", (req, res) => {
  for(let urls in urlDatabase){
    if(req.params.id === urls){
      let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      user_id: users[req.cookies["user_id"]]};
      res.render("urls_show", templateVars);  
    }
  }
  res.redirect(404,"http://localhost:8080/urls")
});

//removing a url resource 
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
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
    let randomNum = Math.floor((Math.random()*61))
    randomString += characters[randomNum];
  }
  return randomString;
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
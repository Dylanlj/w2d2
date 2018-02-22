const bodyParser = require('body-parser');
let express = require("express");
let PORT = process.env.PORT || 8080;
let cookieParser = require('cookie-parser')
let app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
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

//brings up urls new page
app.get("/urls/new", (req,res) => {
  let templateVars = {username: req.cookies["username"]}
  res.render("urls_new", templateVars);
});



//updates a long URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      username: req.cookies["username"]};
  res.render("urls_show", templateVars);
})

//receives login username
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect('http://localhost:8080/urls')
})

//clears cookie on logout
app.post("/logout", (req, res) => {
  res.clearCookie('username')
  res.redirect('http://localhost:8080/urls')
})

//urls page, index
app.get("/urls", (req, res) => {
 let templateVars = {urls: urlDatabase,
                    username: req.cookies["username"] }
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
  let templateVars = {username: req.cookies["username"]};
  res.render('urls_register.ejs', templateVars)
})

app.post("/register", (req, res) => {
// you may be able to do this more efficiently with a for loop, come back to it at the end
  let randomString = generateRandomString()
  users[randomString] = {};
  users[randomString].id = randomString;  
  users[randomString].email = req.body.email;
  users[randomString]['password'] = req.body.password;
  res.cookie('user_id', randomString);
  res.redirect("http://localhost:8080/urls");
})

//provides page with long and short URLS
app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

//removing a url resource 
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect('http://localhost:8080/urls')
})




//tells you if the server is running and listening for client requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString(){
  let characters = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let randomString = '';
  for(var i = 1; i < 7; i++){
    let randomNum = Math.floor((Math.random()*61))
    randomString += characters[randomNum];
  }
  return randomString;
}


//redirects the client using the shortURLs longURL site
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]){
    res.status(302).send({
      error: 'incorrect short URL',
      next: 'redirect'
    });
  }
  res.redirect(302, urlDatabase[req.params.shortURL]);
});

// you're very inconsistent with '' and "", pick one stupid


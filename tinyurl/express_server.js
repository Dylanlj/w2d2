const bodyParser = require('body-parser');
let express = require("express");
let app = express();
let PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!")
})

//brings up urls new page
app.get("/urls/new", (req,res) => {
  res.render("urls_new");
});

//i believe this receives the req and res from urls_new.ejs
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
//this effectively sends the client to urls_show.ejs
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
})

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars)
})

//provides page with long and short URLS
app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

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
  res.redirect(urlDatabase[req.params.shortURL]);
});
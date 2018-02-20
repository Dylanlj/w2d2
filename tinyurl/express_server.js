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

//i beleive this receives the req and res from urls_new.ejs
app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");
})

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars)
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id};
  res.render("urls_show", templateVars);
});
 
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

console.log(generateRandomString())

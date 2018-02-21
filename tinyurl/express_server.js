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

//i believe this receives the req and res from urls_new.ejs as post request
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
//this effectively sends the client to urls_show.ejs
  res.redirect(302, `http://localhost:8080/urls/${shortURL}`);
})

//removing a resource
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect('http://localhost:8080/urls')
})

//updates a long URL
app.post("/urls/:id", (req, res) => {


  urlDatabase[req.params.id] = req.body.longURL;
  console.log(urlDatabase)
})


app.get("/urls", (req, res) => {
 let templateVars = {urls: {}};
 //adds the long name to the short name as a string
    for (let shortURL in urlDatabase){
      templateVars.urls[shortURL] = urlDatabase[shortURL] + ' ====> ' + shortURL;
    }
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
  if(!urlDatabase[req.params.shortURL]){
    res.status(302).send({
      error: 'incorrect short URL',
      next: 'redirect'
    });
  }
  res.redirect(302, urlDatabase[req.params.shortURL]);
});







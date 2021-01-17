'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// VIEWS
app.get('/hello', homeHandler);
app.get('/searches/new', bookSearchForm);
// API CALLS
app.post('/searches', searchBooks);

// Fucntion Handlers

function searchBooks(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q='

  if( req.body.author !== '' ){
    url+=`inauthor:${req.body.author}`;
  }
  if( req.body.title !== '' ) {
    url+=`intitle:${req.body.title}`;
  }

  superagent.get(url)
    .then(data => data.body.items.map(book => new Book(book.volumeInfo)))
    .then(results => res.render('pages/searches/show', {data: results}));
}

function bookSearchForm(req, res) {
  res.render('pages/searches/new');
}

function homeHandler(req, res) {
  res.render('pages/index');
}

// Constructor

function Book(obj) {
  const imgHolder = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = obj.title || 'No title available';
  this.author = obj.authors[0] || 'No author listed';
  this.description = obj.description || 'No description available';
  this.image_url = obj.imageLinks.thumbnail || obj.imageLinks.smallThumbnail || imgHolder;
  // this.isbn = obj.industryIdentifiers[0].identifier || 'No ISBN available';
}

app.listen(PORT, ()=> console.log(`Now listening on port ${PORT}`));

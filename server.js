'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const { render } = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

//DATABASE
const client = new pg.Client(process.env.DATABASE_URL)
client.connect()
client.on('error', err => {
  console.error(err);
})

// VIEWS
app.get('/', homeHandler);
app.get('/searches/new', bookSearchForm);
app.get('/books/:id', detailsHandler);
app.get('*', errorHandler);


// API CALLS
app.post('/searches', searchBooks);

// Fucntion Handlers

function searchBooks(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q='
  console.log(req.body)
  if (req.body.search[1] === 'author') {
    url += `inauthor:${req.body.search[0]}`;
  }
  if (req.body.search[1] === 'title') {
    url += `intitle:${req.body.search[0]}`;
  }

  superagent.get(url)

    .then(data => data.body.items.map(book => new Book(book.volumeInfo)))

    .then(results => res.render('pages/searches/show', { data: results }))

    .catch(err => {
      console.log(err)
      errorHandler(req, res)
    })
}

function bookSearchForm(req, res) {
  res.render('pages/searches/new');
}


function homeHandler(req, res) {
  // res.render('pages/index');
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => {
      res.render('pages/index', { data: results.rows, bookCount: results.rows.length })
    })
    .catch(err => {
      errorHandler(req, res)
      console.log(err);
    });
}

function detailsHandler(req, res) {
  let SQL = 'SELECT * FROM books WHERE id = $1'
  let values = [req.params.id]
  return client.query(SQL, values)
    .then(results => {
      res.render('pages/books/details', { data: results.rows[0] });
    })
    .catch(err => {
      errorHandler(req, res)
      console.log(err);
    });
}


function errorHandler(req, res) {
  res.render('pages/error')
}

// Constructor

function Book(obj) {
  const imgHolder = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = obj.title || 'No title available';
  this.author = obj.authors || 'No author listed';
  this.description = obj.description || 'No description available';
  this.image_url = obj.imageLinks.thumbnail || obj.imageLinks.smallThumbnail || imgHolder;
  this.isbn = obj.industryIdentifiers.identifier || 'No ISBN available';
}

app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));

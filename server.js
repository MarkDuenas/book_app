'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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

app.put('/update/:id', updateHandler);

app.get('*', errorHandler);


// API CALLS
app.post('/searches', searchBooks);
app.post('/books', bookCollectionHandler);

// Fucntion Handlers

function updateHandler(req, res) {
  // destructure
  let {author, title, isbn, image_url, description} = req.body;

  let SQL = 'UPDATE books SET author=$1, title=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6;';
  let values = [author, title, isbn, image_url, description, req.params.id];

  client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.id}`))
    .catch( err => {
      console.log(err);
      errorHandler(req, res);
    })
}

function bookCollectionHandler(req, res){
  let SQL = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5);'
  let values = [req.body.author, req.body.title, req.body.isbn, req.body.image_url, req.body.description];

  client.query(SQL, values)
  
  let SQL2 = 'SELECT * FROM books WHERE title = $1';
  let safeValue = [req.body.title];

  client.query(SQL2, safeValue)
    .then(result => {
      console.log(result)
      res.redirect(`/books/${result.rows[0].id}`)
    })
    .catch( err => {
      console.log(err);
      errorHandler(req, res);
    })
}

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
  this.image_url = obj.imageLinks? obj.imageLinks.thumbnail : imgHolder;
  this.isbn = obj.industryIdentifiers ? obj.industryIdentifiers[0].identifier : 'No ISBN available';
}

app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));

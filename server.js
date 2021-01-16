'use strict';

require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

app.get('/hello', homeHandler);

// Fucntion Handlers

function homeHandler(req, res) {
  res.render('pages/index');
}

app.listen(PORT, ()=> console.log(`Now listening on port ${PORT}`));

 DROP TABLE IF EXISTS bookapp;
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(255),
  image_url TEXT,
  description TEXT
  )

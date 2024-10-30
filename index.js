import express from "express";
import ejs from "ejs";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const googleBooksAPI = "https://www.googleapis.com/books/v1";
const googleBooksAPIKey = "AIzaSyBHlz8SKuMETU9xu1d0JlAqRCyqyYiLZCw";

const db = new pg.Client({
  database: "book_reviews",
  host: "localhost",
  user: "postgres",
  password: "password",
  port: 5432,
});

db.connect();

async function getBooks(book_id) {
  let book;
  let book_notes;
  if (book_id) {
    book = await db.query("SELECT * FROM books WHERE id = $1", [book_id]);
    book_notes = await db.query("SELECT * FROM book_notes WHERE book_id = $1", [
      book_id,
    ]);
  } else {
    book = await db.query("SELECT * FROM books");
    book_notes = await db.query("SELECT * FROM book_notes ");
  }
  return { books: book.rows, book_notes: book_notes.rows };
}

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/", async (req, res) => {
  const data = await getBooks();

  res.render("index.ejs", data);
});

app.get("/book/:id", async (req, res) => {
  const book_id = parseInt(req.params.id);
  const book = await getBooks(book_id);
  res.json(book);
});

app.post("/book", async (req, res) => {
  const input = req.body;
  const result = await db.query(
    "INSERT INTO books (title, author, isbn, rating, review) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [
      input.title,
      input.author,
      input.isbn,
      parseInt(input.rating),
      input.review,
    ]
  );
  await db.query(
    "INSERT INTO book_notes (book_id, notes) VALUES ($1, $2) RETURNING *",
    [result.rows[0].id, input.notes]
  );
  res.json(result);
});

app.put("/book/:id", async (req, res) => {
  const book_id = parseInt(req.params.id);
  const input = req.body;
  const updatedBook = await db.query(
    "UPDATE books SET title = $1, author = $2, isbn = $3, rating = $4, review = $5 WHERE id = $6 RETURNING *",
    [
      input.title,
      input.author,
      input.isbn,
      parseInt(input.rating),
      input.review,
      book_id,
    ]
  );
  await db.query("UPDATE book_notes SET notes = $1 WHERE book_id = $2", [
    input.notes,
    book_id,
  ]);

  res.json(updatedBook.rows);
});

app.delete("/book", async (req, res) => {
  const book_id = parseInt(req.body.id);

  await db.query("DELETE FROM books WHERE id = $1 ", [book_id]);
  await db.query("DELETE FROM book_notes WHERE book_id = $1", [book_id]);

  res.status(200).json({ message: "book deleted" });
});

app.get("/add-book", async (req, res) => {
  const query = req.query.q;

  if (query) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}`
      );

      const books = response.data.items;
      books.map((book) => {
        if (book.volumeInfo.description) {
          if (book.volumeInfo.description.length > 250) {
            book.volumeInfo.description =
              book.volumeInfo.description.slice(0, 250) + "...";
          }
        }
        return book;
      });

      res.render("addBook.ejs", { books });
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).send("Error fetching books");
    }
  } else {
    res.render("addBook.ejs", { books: [] });
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.q;

  const books = await axios.get(
    `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}
`
  );

  res.json(books.data.items);
});
app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});

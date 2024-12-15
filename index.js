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

const app = express();
const port = 3000;
const genres = [
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Historical Fiction",
  "Adventure",
  "Biography",
  "Self-Help",
  "Philosophy",
  "Psychology",
  "Nonfiction",
  "Memoir",
  "Science",
  "Humor",
  "Poetry",
  "Drama",
  "Cooking",
  "Art",
  "Travel",
  "Health",
  "Politics",
  "Religion",
  "True Crime",
  "Education",
  "Graphic Novel",
  "Children",
  "Sports",
  "Business",
];

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

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

async function fetchQuote() {
  try {
    const response = await axios.get("https://zenquotes.io/api/random/");

    return response.data[0].h;
  } catch (err) {
    console.log(`error fetching quote ${err}`);
  }
}

function truncateDescription(books) {
  return books.map((book) => {
    if (
      book.volumeInfo.description &&
      book.volumeInfo.description.length > 250
    ) {
      book.volumeInfo.description =
        book.volumeInfo.description.slice(0, 250) + "...";
    }
    return book;
  });
}

async function fetchBooksAPI(query) {
  try {
    const startIndex = Math.floor(Math.random() * 50); // Random start
    const genre = query || genres[Math.floor(Math.random() * genres.length)];
    const response = await axios.get(
      `${googleBooksAPI}/volumes?q=${
        query
          ? `intitle:${genre}`
          : `${genre}&startIndex=${startIndex}&maxResults=10`
      } `,
      { params: { key: googleBooksAPIKey } }
    );

    let books = response.data.items;
    books = truncateDescription(books);

    return books;
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send("Error fetching books");
  }
}
async function fetchBookByIdAPI(id) {
  try {
    const response = await axios.get(`${googleBooksAPI}/volumes/${id}`, {
      params: { key: googleBooksAPIKey },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching books:", error);
  }
}

app.get("/api/fetchBookById/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookData = await fetchBookByIdAPI(bookId);

    res.json(bookData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch book details" });
  }
});

app.get("/", async (req, res) => {
  const data = await getBooks();
  const quote = await fetchQuote();
  res.render("index.ejs", { books: data.books, quote: quote });
});

app.get("/book/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = await getBooks(bookId);
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
      const books = await fetchBooksAPI(query);
      res.render("addBook.ejs", { books: books });
    } catch (error) {
      res.status(500).send("Error fetching books");
    }
  } else {
    try {
      const books = await fetchBooksAPI();
      res.render("addBook.ejs", { books: books });
    } catch (error) {
      res.status(500).send("Error fetching books");
    }
  }
});

app.get("/view-book", (req, res) => {
  res.render("viewBook.ejs");
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});

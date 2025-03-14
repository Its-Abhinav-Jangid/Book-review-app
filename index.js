import express from "express";
import ejs from "ejs";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import { htmlToText } from "html-to-text";

const googleBooksAPI = "https://www.googleapis.com/books/v1";
const googleBooksAPIKey = "AIzaSyBHlz8SKuMETU9xu1d0JlAqRCyqyYiLZCw";
const baseURL = "http://localhost:3000";
const db = new pg.Client({
  database: "book_review_app",
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

app.use(express.json());

const options = {
  wordwrap: 130,
};

function htmlConvertor(html) {
  return htmlToText(html, options);
}

async function getBooks(book_id) {
  let book;
  let book_details;
  if (book_id) {
    book = await db.query(
      "SELECT * FROM books WHERE id = $1 ORDER BY id ASC ",
      [book_id]
    );
    book_details = await db.query(
      "SELECT * FROM book_details WHERE book_id = $1 ORDER BY book_id ASC ",
      [book_id]
    );
  } else {
    book = await db.query("SELECT * FROM books ORDER BY id DESC ");
    book_details = await db.query(
      "SELECT * FROM book_details ORDER BY book_id DESC "
    );
  }
  return { books: book.rows, book_details: book_details.rows };
}

async function fetchQuote() {
  try {
    const response = await axios.get("https://zenquotes.io/api/random/");
    if (response.data) {
      return response.data[0].h;
    } else {
      return null;
    }
  } catch (err) {
    console.log(`error fetching quote ${err}`);
    return null;
  }
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
    if (books) {
      books.map((book) => {
        book["string"] = JSON.stringify(book);
      });

      return books;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching books:", error.message);
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
    console.error("Error fetching books:", error.message);
  }
}

app.get("/htmlToText", (req, res) => {
  res.json({ text: htmlConvertor(req.query.html) });
});

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

async function getUserData() {
  try {
    const userData = await db.query("SELECT * FROM users");
    if (userData.rows.length > 0) {
      return userData.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
  }
}

app.post("/register", async (req, res) => {
  const username = req.body.username;
  try {
    await db.query("INSERT INTO users (name) VALUES ($1)", [username]);
    res.redirect("/");
  } catch (error) {
    res.send(
      `Sorry, we were unable to process your request. Internal server error: ${error.message}`
    );
    console.error(error);
  }
});

app.get("/", async (req, res) => {
  const data = await getBooks();
  const quote = await fetchQuote();
  const userData = await getUserData();
  res.render("index.ejs", {
    books: data.books,
    quote: quote,
    userData: userData,
  });
});
app.get("/book_details/:id", async (req, res) => {
  const response = await axios.get(`${baseURL}/book/${req.params.id}`);
  res.render("viewBook.ejs", response.data);
});

app.get("/book/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = await getBooks(bookId);
  res.json(book);
});

app.post("/book", async (req, res) => {
  const input = req.body;
  const result = await db.query(
    "INSERT INTO books (title, author, isbn, rating, genre, cover_image_url, published_year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [
      input.title,
      input.author,
      input.isbn,
      parseInt(input.rating),
      input.genre,
      input.cover_image_url,
      input.published_year,
    ]
  );
  const book_details = await db.query(
    "INSERT INTO book_details (book_id, notes,  description, pages, publisher, review) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [
      result.rows[0].id,
      input.notes,
      input.description,
      parseInt(input.pages) || -1,
      input.publisher,
      input.review,
    ]
  );

  res.redirect(`/book_details/${result.rows[0].id}`);
});

app.post("/editBook/:id", async (req, res) => {
  const book_id = parseInt(req.params.id);
  const input = req.body;
  let prevBookQuery;
  try {
    prevBookQuery = await axios.get(`http://localhost:3000/book/${book_id}`);
  } catch (error) {
    console.error(error);
  }

  const prevData = {
    ...prevBookQuery.data.books[0],
    ...prevBookQuery.data.book_details[0],
  };

  const updatedBook = await db.query(
    "UPDATE books SET title = $1, author = $2, genre = $3, published_year = $4, rating = $5,cover_image_url = $6, isbn = $7 WHERE id = $8 RETURNING *",
    [
      input.title || prevData.title,
      input.author || prevData.author,
      input.genre || prevData.genre,
      parseInt(input.published_year) || prevData.published_year,
      parseInt(input.rating) || prevData.rating,
      input.cover_image_url || prevData.cover_image_url,
      input.isbn || prevData.isbn,
      book_id,
    ]
  );
  await db.query(
    "UPDATE book_details SET pages = $1, publisher = $2,description= $3, notes = $4, review = $5 WHERE book_id = $6",
    [
      parseInt(input.pages) || prevData.pages,
      input.publisher || prevData.publisher,
      input.description || prevData.description,
      input.notes,
      input.review,
      book_id,
    ]
  );

  res.redirect(`/book_details/${book_id}`);
});

app.delete("/book", async (req, res) => {
  const book_id = parseInt(req.body.id);

  try {
    // Perform the DELETE operations
    await db.query("DELETE FROM books WHERE id = $1", [book_id]);
    await db.query("DELETE FROM book_details WHERE book_id = $1", [book_id]);

    // Send success response
    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error deleting book:", error);
    res.status(500).json({
      error: true,
      message: "An internal server error occurred",
      details: error.message,
    });
  }
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
      // const testData = [
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      //   {
      //     volumeInfo: {
      //       averageRating: 4,
      //       title: "The pragmatic programmer",
      //       authors: ["Andrew Hunt", "David Thomas"],
      //       categories: ["programming"],
      //       publishedDate: "2018-12-2",
      //       pageCount: 300,
      //       publisher: "Pearson",
      //       description:
      //         "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
      //       industryIdentifiers: [{ identifier: "dfsgsdgd" }],
      //     },
      //   },
      // ];
      // testData.map((book) => {
      //   book["string"] = JSON.stringify(book);
      // });

      res.render("addBook.ejs", { books: books });
    } catch (error) {
      res.status(500).send("Error fetching books");
    }
  }
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});

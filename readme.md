# Book Review App

A simple web app to track and review books you have read. This app allows users to store book details, add reviews, rate books, and keep track of their reading progress.

## Features

- Add books with details like title, author, genre, published year, etc.
- Rate books with a 5-star rating system.
- Add and edit reviews for each book.
- Delete books from the collection.

## Installation

To run the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/book-review-app.git
   cd book-review-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your database and configuration files:

   To set up the database for the Book Review App, follow these steps:

   ### 1. Create the Database

   First, create a database to store the book reviews. You can do this with the following SQL command:

   ```sql
   CREATE DATABASE book_review_app;

    CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    published_year INT,
    rating INT CHECK (rating >= 0 AND rating <= 5),
    cover_image_url TEXT
    );

    -- Create book_details table
    CREATE TABLE book_details (
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    pages INT,
    publisher VARCHAR(255),
    description TEXT,
    notes TEXT,
    review TEXT,
    PRIMARY KEY (book_id)
    );
   ```

### 2. Change credentials in `index.js`

In the backend of your application, you will need to configure the database credentials to connect to your PostgreSQL database. Open the `index.js` (or equivalent) file and update the `pg.Client` configuration with your actual database credentials.

Here’s an example of how to change the credentials:

    ```javascript

    // Replace the values below with your actual database credentials
    const db = new Client({
    database: "book_review_app", // Your database name
    host: "localhost", // Database host (use the IP address or hostname of your database if not local)
    user: "postgres", // Your PostgreSQL username
    password: "password", // Your PostgreSQL password
    port: 5432, // PostgreSQL default port is 5432
    });

    // Connect to the PostgreSQL database
    db.connect();
    ```
4. Run the app:
```bash
    node ./index.js
```
Your app will be live at `http://localhost:3000` (or another port depending on your setup).
## Usage

After starting the app, you can:

- Add new books via the "Add Book" button.
- View books in your collection with their details.
- Edit book details, add reviews, and delete books.

## Technologies Used

- Node.js
- Express.js
- EJS (for templating)
- PostgreSQL (or your database of choice)
- CSS/HTML (for front-end design)
- Font Awesome (for icons)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or pull requests, feel free to open an issue or submit a pull request.

### How to Contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to your branch (`git push origin feature-name`).
6. Open a pull request.


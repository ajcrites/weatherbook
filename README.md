# Weatherbook (0.0)

## Installation

Run `npm install`.

To develop locally, you must have a MySQL database available
either remotely or installed on your machine. Update
`config.js` with the appropriate `db` parameters to connect
to your database.

Also update the weather API key if you please since I have
very limited uses of mine.

Create a MySQL database (for example named Weatherbook)

    CREATE SCHEMA Weatherbook

... and initialize the schema.

    mysql Weatherbook < schema.sql

Use `mysql` credentials as needed.

You can start the server with `npm start`.

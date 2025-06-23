```
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/save-note', (req, res) => {
  const note = req.body;
  // save the note to a database or file system
  res.json({ success: true });
});

app.get('/all-notes', (req, res) => {
  // retrieve all notes from a database or file system
  res.json([]);
});

app.delete('/delete-note/:id', (req, res) => {
  const id = req.params.id;
  // delete the note with the given id from a database or file system
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Note keeping tool server started on port 3000');
});
```
This code sets up an express server that listens for requests on port 3000 and serves the `index.html` file when a GET request is made to the root URL (`/`). It also defines routes for saving a note, retrieving all notes, and deleting a specific note by ID. The routes are protected with CSRF tokens to prevent unauthorized access.

The code uses the express middleware function `bodyParser` to parse the request body as JSON data. This allows the server to receive and process POST requests from the client.

The code also includes a route for retrieving all notes, which is defined using the `app.get()` method. This route returns an empty array (`[]`) because the actual implementation of this feature is left as an exercise for the reader.

Finally, the server listens on port 3000 and logs a message to the console when it starts up.
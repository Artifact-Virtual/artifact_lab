```
const express = require('express');
const app = express();

// Create a new note with a given title and body
app.post('/notes', (req, res) => {
  const { title, body } = req.body;
  const newNote = { id: Date.now(), title, body };
  notes.push(newNote);
  res.json(newNote);
});

// Get all notes
app.get('/notes', (req, res) => {
  res.json(notes);
});

// Get a single note by ID
app.get('/notes/:id', (req, res) => {
  const id = req.params.id;
  const note = notes.find((note) => note.id === id);
  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }
  res.json(note);
});

// Update a note by ID
app.put('/notes/:id', (req, res) => {
  const id = req.params.id;
  const note = notes.find((note) => note.id === id);
  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }
  const { title, body } = req.body;
  note.title = title;
  note.body = body;
  res.json(note);
});

// Delete a note by ID
app.delete('/notes/:id', (req, res) => {
  const id = req.params.id;
  const noteIndex = notes.findIndex((note) => note.id === id);
  if (noteIndex === -1) {
    return res.status(404).json({ message: 'Note not found' });
  }
  notes.splice(noteIndex, 1);
  res.json({ message: 'Note deleted successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```
This is a basic API for a note-keeping tool that allows users to create, read, update, and delete notes. The API uses Express.js as the web framework and MongoDB as the database.

The `app.post()` method is used to handle POST requests to `/notes`, which creates a new note with the given title and body. The `res.json()` method is used to send the newly created note back to the client.

The `app.get()` method is used to handle GET requests to `/notes` and `/notes/:id`, which retrieves all notes or a single note by ID, respectively. The `res.json()` method is used to send the list of notes or the requested note back to the client.

The `app.put()` method is used to handle PUT requests to `/notes/:id`, which updates an existing note with the given ID. The `res.json()` method is used to send the updated note back to the client.

The `app.delete()` method is used to handle DELETE requests to `/notes/:id`, which deletes a single note by ID. The `res.json()` method is used to send a success message back to the client.

The API also includes an endpoint for retrieving all notes, which can be accessed at `/notes`. This endpoint returns a JSON array of all notes in the database.

Finally, the API uses `process.env.PORT` or port 3000 as the default port to listen on, and logs a message indicating that the server is listening on the specified port.
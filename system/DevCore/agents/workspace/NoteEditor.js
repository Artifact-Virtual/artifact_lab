```
// NoteEditor.js

import React, { useState } from 'react';
import './NoteEditor.css';

function NoteEditor() {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState([]);

  function handleChange(event) {
    setNoteText(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (noteText !== '') {
      const newNote = {
        text: noteText,
        dateCreated: new Date().toISOString(),
      };
      setNotes([...notes, newNote]);
      setNoteText('');
    }
  }

  return (
    <div className="note-editor">
      <form onSubmit={handleSubmit}>
        <textarea value={noteText} onChange={handleChange} />
        <button type="submit">Add Note</button>
      </form>
      {notes.map((note) => (
        <div key={note.dateCreated} className="note-item">
          <p>{note.text}</p>
          <p className="note-date">{new Date(note.dateCreated).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default NoteEditor;
```

This code defines a `NoteEditor` component that allows users to input and save notes. It uses the `useState` hook to store the note text and the list of saved notes in the component's state. The `handleChange` function updates the `noteText` state when the user types in the textarea, and the `handleSubmit` function adds a new note to the list of saved notes when the form is submitted.

The `NoteEditor` component renders a form with a textarea for inputting the note text and a button for submitting the form. When a new note is added, it is displayed in a list below the form. Each note item includes the note text and the date it was created.

Note that this code assumes that you have already defined the `useState` hook and the `notes` array in your component's state. You may need to modify the code to fit your specific use case.
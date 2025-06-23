```
import React, { useState } from 'react';
import NoteList from './NoteList';
import NoteEditor from './NoteEditor';

function App() {
  const [notes, setNotes] = useState([]);

  const handleAddNote = (note) => {
    setNotes((prevNotes) => [...prevNotes, note]);
  };

  const handleDeleteNote = (id) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  };

  return (
    <div>
      <NoteList notes={notes} onDelete={handleDeleteNote} />
      <NoteEditor onAdd={handleAddNote} />
    </div>
  );
}

export default App;
```
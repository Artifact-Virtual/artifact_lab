# Note Keeping Tool

This is a simple note-keeping tool that allows users to create, edit, and delete notes. The app uses a JSON file to store the notes, so it's easy to backup and share your notes with others.

## Usage

To use the app, simply clone this repository and run `npm install` to install the dependencies. Then, you can start the app by running `node index.js`. The app will then be available at `http://localhost:3000` in your web browser.

### Creating a Note

To create a new note, simply click the "New Note" button in the top-right corner of the screen. This will open up a form where you can enter a title and some text for your note. Once you've entered your information, click the "Save" button to save the note. Your note will then be displayed on the page with its own unique URL.

### Editing a Note

To edit an existing note, simply click on the title of the note you want to edit. This will open up the same form that was used to create the note, but with the current content already filled in. You can then make any necessary changes and click "Save" again to update the note.

### Deleting a Note

To delete an existing note, simply click on the trash icon next to the note you want to delete. This will remove the note from the list of notes and delete it from the JSON file.

## Technical Details

The app uses Node.js and Express.js to handle HTTP requests and responses. It also uses a simple JSON file to store the notes, which allows for easy backup and sharing of notes with others. The app is designed to be simple and easy to use, but it's also relatively customizable if you want to add more features or change the design.
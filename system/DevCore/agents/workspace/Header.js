```
import React from 'react';

function Header() {
  return (
    <div className="header">
      <h1>Note Keeper</h1>
      <p>Take notes and organize your thoughts with our simple note-taking tool.</p>
    </div>
  );
}

export default Header;
```
This code defines a functional component called `Header` that renders an HTML `<div>` element with a class name of "header". The `div` element contains two child elements: an `<h1>` element with the text "Note Keeper" and a `<p>` element with the text "Take notes and organize your thoughts with our simple note-taking tool.".

The `Header` component is exported using the `export default` statement, which makes it available for use in other parts of the application.
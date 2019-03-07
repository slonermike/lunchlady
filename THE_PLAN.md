# Planned Improvements
- Unify entry editing code between `lunchlady add` and `lunchlady manage`
- Dynamic specification of blog entry tags.
- De-spaghetti `lunchlady add` code.
- Change `updateEntry` so it no longer updates state in place.
- Implement `inquirer-fuzzy-path` input for folder configuration.
- Allow user to specify client code destination directory.
- Animate thingy while fetching from github -- https://github.com/sindresorhus/log-update.
- Use inquirer's built in answer validation (`validate`) for directory input.
- Integrate `log-symbols` with Log utility -- https://github.com/sindresorhus/log-symbols.
- Move all commands into an inquirer-driven selection flow.
- Set up `scripts` in `package.json` to automatically build and spin up an instance of `sloppy-joe`

# Possible Improvements
- Add new entry without existing HTML file.  Create the HTML file.  Auto-open in a specified editor?
- Ability to spin up the server via a `lunchlady` command -- e.g. `lunchlady start`

# Challenges Ahead
- How do we handle images?
- How do we handle CSS?

# Known Issues
- If you try to re-run `lunchlady setup` it will not allow you to change your source content folder.

# Releases

## v0.0.1
Initial release of lunchlady w/ minimal awesomeness.

### Features
- Automatically pull in `sloppy-joe` repo code.
- Automatically link content folder into `sloppy-joe` instance.
- Ability to update data for an entry.
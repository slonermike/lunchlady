# Planned Improvements
- De-spaghetti `lunchlady add` code.
- Change `updateEntry` so it no longer updates state in place.
- Allow user to specify client code destination directory.
- Animate thingy while fetching from github -- https://github.com/sindresorhus/log-update.
- Use inquirer's built in answer validation (`validate`) for directory input.
- Integrate `log-symbols` with Log utility -- https://github.com/sindresorhus/log-symbols.
- Move all commands into an inquirer-driven selection flow.
- Set up `scripts` in `package.json` to automatically build and spin up an instance of `sloppy-joe`
- Add no-sync option to `lunchlady setup`?  Only needs to run once, so might not be necessary.  Useful for offline development.
- Link `sloppy-joe` repo to a specific, supported SHA, or branch (preferred).
- Delete command in `lunchlady manage` (with confirmation)
- Sort tag list based on frequency of tags' appearance.

# Possible Improvements
- Add new entry without existing HTML file.  Create the HTML file.  Auto-open in a specified editor?
- Ability to spin up the `sloppy-joe` server via a `lunchlady` command -- e.g. `lunchlady start`
- Should I disallow spaces on tags?  Might make it nicer for deeplinks.
- Locally-run web interface?  There are rich text editors out there that could be utilized.

# Open Questions
- What are 'sections' going to be?  Content chosen via tags?  Chosen via explicit assignment?

# Challenges Ahead
- How do we handle images?
- How do we handle CSS?

# Known Issues
- If you try to re-run `lunchlady setup` it will not allow you to change your source content folder.
- If you run `luchlady manage` before `lunchlady add` it gives insufficient rectification instructions.

# Releases

## vNext
Making it useful.  Documenting the process.

### Features
- Updated readme documentation to include more descriptive indstructions.
- Added The Plan! (this document).
- Implemented `inquirer-path` input for folder configuration.
- Unify entry editing code between `lunchlady add` and `lunchlady manage`
- Dynamic specification of blog entry tags.
- Limit length of tags to 32 characters.
- Disallow symbols, spaces, capitalization in tags, convert to 'param case'.

## v0.0.1
Initial release of lunchlady w/ minimal awesomeness.

### Features
- Automatically pull in `sloppy-joe` repo code.
- Automatically link content folder into `sloppy-joe` instance.
- Ability to update data for an entry.
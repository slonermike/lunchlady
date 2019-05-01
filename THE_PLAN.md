# Planned Improvements
- Allow user to specify client code destination directory.
- Animate thingy while fetching from github -- https://github.com/sindresorhus/log-update.
- Use inquirer's built in answer validation (`validate`) for directory input.
- Integrate `log-symbols` with Log utility -- https://github.com/sindresorhus/log-symbols.
- Set up `scripts` in `package.json` to automatically build and spin up an instance of `sloppy-joe`
- Command: Delete entry
- Command: Delete page
- Command: `lunchlady nuke` which resets the content json file to an empty site.
- Rename everything 'blog' to 'section'
- Rename everything 'article' to 'entry'
- Run `lunchlady` from within the blog folder rather than having a separate lunchlady folder for each blog.  This should eliminate the need for a `config.json` and lighten up the client-side file overhead. (where to put `sloppy-joe` code?)

# Possible Improvements
- Add new entry without existing HTML file.  Create the HTML file.  Auto-open in a specified editor?
- Ability to spin up the `sloppy-joe` server via a `lunchlady` command -- e.g. `lunchlady start`
- Locally-run web interface?  There are rich text editors out there that could be utilized.
- Automatically go into tag creation if no tags exist yet.
- Ability to preview an entry using html-to-text: https://www.npmjs.com/package/html-to-text
- Make a manual sort inquirer plugin.

# Open Questions
- Does immutability really matter in this case?  It's kind of a pain, and not really necessary unless we plan to have some sort of undo functionality.
  - If so, then immutability should be enforced, at least in certain builds.

# Known Issues
- If you try to re-run `lunchlady setup` it will not allow you to change your source content folder.
- If you run `luchlady manage` before `lunchlady add` it gives insufficient rectification instructions.

# Releases

## v0.2.0
Multi-page sites.

### Features
- Move all commands (except `setup`) into an inquirer-driven selection flow.
- Link `sloppy-joe` repo to a specific, supported SHA, or branch (preferred).
- All content management promises resolve to an updated copy of the whole site.
- Added versioning, migration for the output file.
- Auto-sort entries by date.
- Added sort type to sections
- Ability to add entries to a specific page.
- Command: Add page
- Ability to edit blog entries on a specific page.
- Move content.json into HTML for more centralized content management.
- Ability to manually reorder sections.
- Ability to add blog entries from a subdirectory.
- Allow specification of CSS files to use from content directory.

### Bugs Fixed
- Initial run of `lunchlady setup` fails to sync branches other than `master`

## v0.1.0
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

# Planned Improvements
- Allow user to specify client code destination directory.
- Animate thingy while fetching from github -- https://github.com/sindresorhus/log-update.
- Use inquirer's built in answer validation (`validate`) for directory input.
- Integrate `log-symbols` with Log utility -- https://github.com/sindresorhus/log-symbols.
- Set up `scripts` in `package.json` to automatically build and spin up an instance of `sloppy-joe`
- Command: Delete entry
- Command: Delete page
- Rename everything 'blog' to 'section'
- Rename everything 'article' to 'entry'
- Ability to reorder sections at top level.
- Ability to rename site.

# Possible Improvements
- Add new entry without existing HTML file.  Create the HTML file.  Auto-open in a specified editor?
- Ability to spin up the `sloppy-joe` server via a `lunchlady` command -- e.g. `lunchlady start`
- Locally-run web interface?  There are rich text editors out there that could be utilized.
- Automatically go into tag creation if no tags exist yet.
- Ability to preview an entry using html-to-text: https://www.npmjs.com/package/html-to-text
- Make a manual sort inquirer plugin.
- Hide sections with no content.

# Open Questions
- Does immutability really matter in this case?  It's kind of a pain, and not really necessary unless we plan to have some sort of undo functionality.
  - If so, then immutability should be enforced, at least in certain builds.

# Known Issues
- Adding a new article should go straight into editing it after adding it.  It doesn't.

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
- Ability to manually reorder articles within sections.
- Ability to add blog entries from a subdirectory.
- Allow specification of CSS files to use from content directory.
- Ability to rename sections.
- `lunchlady` creates a blog from scratch in the working directory.
- Running `lunchlady` the first time will pull down sloppy joe and create a content folder with a sample entry.
- Configuration is now baked into the app and the config.json file has been removed.

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

# lunchlady
A stupid-simple backend-less CMS built on NodeJS.

## How to Set Up
1. Install Lunchlady via NPM `npm install -g lunchlady`.
   1. OR: sync to this repo and run `npm install && tsc && npm link`, which will point the `lunchlady` command to your locally-compiled version.
2. Run `lunchlady` and select `Initialize Blog`
   1. Lunchlady will retrieve the `sloppy-joe` repo and prompt you to give your site a title.
3. Back out, and your site will automatically be saved.
4. Run `npm install` to retrieve all the npm dependencies for `sloppy-joe`
5. To start your local blog server, from the `sloppy-joe` folder, run `npm run start`.

## How to add an entry.
1. Create a blog entry as an HTML file and place it in the `public/content` folder, where you'll find `dummy-entry.html` currently place-holding for your blog.
2. Run `lunchlady` and select `Manage Content`
3. Select or create a new section.
4. Select `New Article`

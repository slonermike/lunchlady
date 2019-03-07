# lunchlady
A stupid-simple backend-less CMS built on NodeJS.

## How to Use
1. Install Lunchlady via NPM `npm install -g lunchlady`.
   1. OR: sync to this repo and run `npm install && tsc && npm link`, which will point the `lunchlady` command to your locally-compiled version.
2. Create a blog entry as an HTML file and place it in the directory that will become the directory for your blog.  Can be anywhere on your machine.
3. Navigate to the directory where you want the `sloppy-joe` (blog client code) directory to be created.
4. Run `lunchlady configure` and provide the path to that directory.
   1. This will pull in the `sloppy-joe` repository and symlink your content folder into it.
5. Navigate into the `sloppy-joe` folder created by `lunchlady configure` and run `npm install`.
6. Run `lunchlady add` to add your HTML file as a blog entry.
7. To start your local blog server, from the `sloppy-joe` folder, run `npm run start`.
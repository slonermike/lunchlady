# lunchlady
A stupid-simple backend-less CMS built on NodeJS.

## How to Use
1. Install Lunchlady via NPM `npm install lunchlady` OR sync to this repo and run `npm install && tsc && npm link`
   1. If you don't have `tsc` you can get it with `npm install -g typescript`
2. Create a blog entry as an HTML file and place it in the directory that will become the directory for your blog.  Can be anywhere on your machine.
3. Run `lunchlady configure` and provide the path to that directory.
   1. This will pull in the `sloppy-joe` repository and symlink your content folder into it.
4. Navigate into the `sloppy-joe` folder created by `lunchlady configure` and run `npm install`
5. To start your local blog server, from the `sloppy-joe` folder, run `npm run start`
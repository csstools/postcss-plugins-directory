# PostCSS Plugin Directory

## Requirements for inclusion :

- published on npm
- `postcss-plugin` keyword in your `package.json`
- valid repository link in your `package.json`
- valid homepage link in your `package.json`
- valid `peerDependency` value for `postcss`
- [`OSI` approved license](https://opensource.org/licenses/alphabetical)
- package version greater than `1.0.0`

## Request removal from the directory :

If you do not want your plugin to be included, please let us know.
We will remove it as soon as possible.

## How it works :

- we query npm for `keywords:postcss-plugin`
- we check the results against the requirements listed above
- if a new plugin or new version is detected:
  - open a pull request with the update
  - we manually review and merge/reject the update
- daily job updates the directory page

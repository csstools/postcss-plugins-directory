# PostCSS Plugin Directory

## Requirements for inclusion :

- published on npm
- 50 monthly downloads from npm
- `postcss-plugin` keyword in your `package.json`
- valid repository link in your `package.json`
- valid homepage link in your `package.json`
- valid `peerDependency` value for `postcss`
- [`OSI` approved license](https://opensource.org/licenses/alphabetical)
- package version greater than `1.0.0`
- [not listed as a malicious package](https://github.com/DataDog/malicious-software-packages-dataset)

## Requirements for plugin forks :

Forking plugins is a normal and essential part of a decentralized ecosystem of plugins.
We only require that forks try to avoid confusion between themselves and the original plugin.

- same as for regular plugins
- repository link must be specific to your fork
- homepage link must be specific to your fork

Incorrect forks are blocked through a code change in our scripts.
If you corrected the issue and want to be included please open an issue.

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

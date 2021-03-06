# Contributing

- [Contributing](#contributing)
  - [Types of Contributions](#types-of-contributions)
    - [Report Bugs](#report-bugs)
    - [Fix Bugs](#fix-bugs)
    - [Implement Features](#implement-features)
    - [Submit Feedback](#submit-feedback)
  - [Get Started!](#get-started)
  - [Pull Request Guidelines](#pull-request-guidelines)
  - [Tips](#tips)
    - [Generating code from Markdown](#generating-code-from-markdown)
    - [Generate code from Markdown and vice versa](#generate-code-from-markdown-and-vice-versa)
    - [Generate code from Markdown on commit](#generate-code-from-markdown-on-commit)
  - [New release](#new-release)

Contributions are welcome, and they are greatly appreciated! Every little bit
helps, and credit will always be given.

You can contribute in many ways:

## Types of Contributions

### Report Bugs

Report bugs at [https://github.com/NLESC-JCER/cpp2wasm/issues/new?labels=bug&template=10_bug_report.md](https://github.com/NLESC-JCER/cpp2wasm/issues/new?labels=bug&template=10_bug_report.md).

### Fix Bugs

Look through the GitHub issues for bugs. Anything tagged with ["bug"](https://github.com/NLESC-JCER/cpp2wasm/issues?q=is%3Aopen+is%3Aissue+label%3Abug) is open to whoever wants to implement it.

### Implement Features

Look through the GitHub issues for features. Anything tagged with ["enhancement"](https://github.com/NLESC-JCER/cpp2wasm/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement)
 is open to whoever wants to implement it.

### Submit Feedback

The best way to send feedback is to file an issue at [https://github.com/NLESC-JCER/cpp2wasm/issues](https://github.com/NLESC-JCER/cpp2wasm/issues).

If you are proposing a feature go [here](https://github.com/NLESC-JCER/cpp2wasm/issues/new?labels=enhancement&template=20_feature_request.md).

## Get Started!

Ready to contribute? Here's how to set up `cpp2wasm` for local development.

1. Fork the [cpp2wasm repo](https://github.com/NLESC-JCER/cpp2wasm) on GitHub.
2. Clone your fork locally:

    ```shell
    git clone https://github.com/your_name_here/cpp2wasm.git
    ```

3. Install the dependencies as listed in [INSTALL.md#dependencies](INSTALL.md#dependencies).

4. Create a branch for local development::

    ```shell
    git checkout -b name-of-your-bugfix-or-feature
    ```

    Now you can make your changes locally.

5. Write tests where possible. Writing tests should be done in a literate way in [TESTING.md](TESTING.md)

6. When you're done making changes, make sure the Markdown and source code files are entangled with

    ```shell
    make entangle
    ```

7. When `cli/*hpp` or `webassembly/wasm-newtonraphson.cpp` changes, the WebAssembly module also has to be rebuilt. This will require [emscripten](README.md#accessing-c-function-from-JavaScript-in-web-browser). To rebuild the WebAssembly module run:

    ```shell
    make build-wasm
    ```

8. Commit your changes and push your branch to GitHub::

    ```shell
    git add .
    git commit -m "Your detailed description of your changes."
    git push origin name-of-your-bugfix-or-feature
    ```

9. Submit a pull request through the GitHub website.

## Pull Request Guidelines

See [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) for guidelines.

## Tips

## Generating code from Markdown

The [Entangled - Pandoc filters](https://github.com/entangled/filters) Docker image can be used to generate source code files from the Markdown files.

First, store your user id and group as environment variables:

```shell
export HOST_UID=$(id -u)
export HOST_GID=$(id -g)
```

Then,

```{.awk #pandoc-tangle}
docker run --rm --user ${HOST_UID}:${HOST_GID} -v ${PWD}:/data nlesc/pandoc-tangle:0.5.0 --preserve-tabs *.md
```

## Generate code from Markdown and vice versa

Use Entangled deamon to convert code blocks in Markdown to and from source code files.
Each time a Markdown code block is changed the source code files will be updated.
Each time a source code file is changed the code blocks in the Markdown files will be updated.

1. Install [entangled](https://github.com/entangled/entangled)
2. Run entangled daemon with

```shell
entangled daemon
```

### Generate code from Markdown on commit

To automatically generate code from Markdown on each commit, initialize the git hook with.

```shell
make init-git-hook
```

The rest of this section describes how the git hook works.

The pre-commit hook script runs entangle using Docker and adds newly written files to the current git commit.

```{.awk file=.githooks/pre-commit}
#!/bin/sh
# this shell script is stored as .githooks/pre-commit

echo 'Check entangled files are up to date'

# Entangle Markdown to source code and store the output
LOG=$(docker run --rm --user $(id -u):$(id -g) -v ${PWD}:/data nlesc/pandoc-tangle:0.5.0 --preserve-tabs *.md 2>&1 > /dev/null)
# Parse which filenames have been written from output
FILES=$(echo $LOG | perl -ne 'print $1,"\n" if /^Writing \`(.*)\`./')
[ -z "$FILES" ] && exit 0
echo $FILES

echo 'Adding written files to commit'
echo $FILES | xargs git add

```

The hook must be made executable with

```{.awk #hook-permission}
chmod +x .githooks/pre-commit
```

The git hook can be enabled with

```{.awk #init-git-hook}
git config --local core.hooksPath .githooks
```

(`core.hooksPath` config is available in git version >= 2.9)

## New release

A reminder for the maintainers on how to create a new release.

1. Make sure all your changes are committed.
1. Verify that [``CHANGELOG.md``](CHANGELOG.md) has all the relevant changes. Visit [releases page](https://github.com/NLESC-JCER/cpp2wasm/releases) and click on the `?? commits to master since this release` link in the latest release to see the diff between the latest release and ``master``.
1. Verify that the authors list in [``CITATION.cff``](CITATION.cff) is up to date
1. If needed, generate updated Zenodo metadata using the [cffconvert web service](https://us-central1-cffconvert.cloudfunctions.net/cffconvert?url=https://github.com/NLESC-JCER/cpp2wasm/tree/master/&outputformat=zenodo&ignore_suspect_keys), then use its result to update [``.zenodo.json``](.zenodo.json).
1. Create a GitHub release

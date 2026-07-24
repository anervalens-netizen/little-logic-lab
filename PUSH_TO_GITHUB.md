# Publish this repository

The source is already initialized as a local Git repository with an initial commit.

Using GitHub CLI:

```bash
gh auth login
gh repo create anervalens-netizen/little-logic-lab --private --source=. --remote=origin --push
```

Or run:

```bash
./scripts/publish-to-github.sh little-logic-lab --private
```

Using the GitHub website:

1. Create an empty private repository named `little-logic-lab`.
2. Do not initialize it with README or license.
3. From this directory:

```bash
git remote add origin https://github.com/anervalens-netizen/little-logic-lab.git
git push -u origin main
```

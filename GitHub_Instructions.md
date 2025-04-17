# GitHub Setup Instructions

Follow these steps to push your Guitar Tuner app to GitHub:

## 1. Create a new repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" button in the top-right corner and select "New repository"
3. Enter repository details:
   - Owner: johnodonovan
   - Repository name: guitartuner (or any name you prefer)
   - Description: A web-based guitar tuner application built with Flask and Web Audio API
   - Visibility: Public (or Private if you prefer)
   - Do NOT initialize with README, .gitignore, or license (we already have these files)
4. Click "Create repository"

## 2. Push your code to GitHub

After creating the repository, GitHub will show you instructions. Follow the "push an existing repository" instructions.

If you're using HTTPS authentication (username/password), run:

```bash
git remote add origin https://github.com/johnodonovan/guitartuner.git
git push -u origin main
```

You'll be prompted to enter your GitHub username and password. Note that if you have two-factor authentication enabled, you'll need to use a personal access token instead of your password.

If you're using SSH authentication, run:

```bash
git remote add origin git@github.com:johnodonovan/guitartuner.git
git push -u origin main
```

## 3. Generate a Personal Access Token (if needed)

If you have two-factor authentication enabled or prefer using a token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. Give it a name like "Guitar Tuner App"
3. Select scopes: at minimum, select "repo" for full control of repositories
4. Click "Generate token"
5. Copy the token immediately (you won't be able to see it again)
6. Use this token as your password when pushing to GitHub

## 4. Verify your repository

After pushing successfully, visit:
https://github.com/johnodonovan/guitartuner

You should see all your files there, including the README.md with information about the project.

## 5. Set up GitHub Pages (optional)

If you want to make your tuner available online:

1. Go to your repository on GitHub
2. Click Settings → Pages
3. Under "Source", select "main" branch
4. Click "Save"

Your tuner will be available at: https://johnodonovan.github.io/guitartuner/
(Note: You'll need to modify the app to work as a static site for GitHub Pages) 
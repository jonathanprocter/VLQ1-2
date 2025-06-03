# VLQ1-2

A React component for the Valued Living Questionnaire (VLQ-1 and VLQ-2).

## Getting Started

1. Create a React project (for example with `create-react-app`).
2. Copy `complete-vlq-app.tsx` into your project's `src/` folder.
3. Import and render the `VLQApp` component in your application.

```
import VLQApp from './complete-vlq-app';

function App() {
  return <VLQApp />;
}
```

## Deploying with GitHub Pages

1. Install the **gh-pages** package:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Add a `homepage` field in `package.json` pointing to your GitHub Pages URL:
   ```json
   "homepage": "https://<username>.github.io/<repository>"
   ```
3. Add the following scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
4. Run `npm run deploy` to build and publish the app to GitHub Pages.

## License

This project is provided as-is under the MIT license.

# Zero Waste Frontend

## Getting Started
This project is a frontend application built with Vite, React, and TypeScript. It is designed to be a minimal setup for developing a web application with these technologies.

### Prerequisites
- Node.js (v18 or later)
- npm (v8 or later)
- Docker (optional, for running the application in a container)

### Installation
```
npm install
```

### Running the Application
To start the development server, run:
```
npm run dev
```
This will start the application in development mode and open it in your default web browser.
The application will be available at `http://localhost:5173` by default.

### Building the Application
To build the application for production, run:
```
npm run build
```

This will create a `dist` directory with the production build of the application.

## Docker
To run the application in a Docker container, you can use the provided `Dockerfile`. This file is set up to build and run the application in a lightweight container.
### Building the Docker Image
To build the Docker image, run:
```
docker build -t zero-waste-frontend .
```
### Running the Docker Container
To run the Docker container, use the following command:
```
docker run -p 80:80 zero-waste-frontend
```
This will start the application in a container and map port 80 of the container to port 80 of your host machine.
You can then access the application in your web browser at `http://localhost`.


#### React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

#### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

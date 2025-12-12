import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
//import Router from "./app/routing/Router.jsx";
//import "./app/styles/index.css";
import "./app/styles/test.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Formulario from "./Form";

const path = window.location.pathname;

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    {path === "/solicitar" ? <Formulario /> : <App />}
  </StrictMode>
);

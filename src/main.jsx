import React from "react";
import { createRoot } from "react-dom/client";
import Calculadora from "./calculadora.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Calculadora />
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import Calculator from "../../app/kalkulator/page";
import "../../app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Calculator />
  </React.StrictMode>,
);

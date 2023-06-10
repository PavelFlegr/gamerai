import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import App2 from "./pages/App2";
import App3 from "./pages/App3";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Index from "./components";
const Collaboration = lazy(() => import("./components/collaboration"));
const Conversation = lazy(() => import("./components/conversation"));
const Database = lazy(() => import("./components/database"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App3 />,
    children: [
      {
        path: "",
        element: <Index />,
      },
      {
        path: "conversation/:id",
        element: <Conversation />,
      },
      {
        path: "collaboration/:id",
        element: <Collaboration />,
      },
      {
        path: "database",
        element: <Database />,
      },
    ],
  },
  {
    path: "helper",
    element: <App2 />,
  },
  {
    path: "register/:token",
    element: <Register />,
  },
  {
    path: "login",
    element: <Login />,
  },
  {
    path: "*",
    element: <Navigate to={"/"}></Navigate>,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider
      theme={{ colorScheme: "dark" }}
      withGlobalStyles
      withNormalizeCSS
    >
      <Suspense fallback={"blabalbal"}>
        <RouterProvider router={router} />
      </Suspense>
    </MantineProvider>
  </React.StrictMode>
);

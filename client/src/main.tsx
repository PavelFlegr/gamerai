import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import App2 from './App2';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "helper",
    element: <App2/>
  }
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <RouterProvider router={router}/>
    </MantineProvider>
  </React.StrictMode>,
)

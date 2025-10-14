import { useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'

export const AppRouter = () => {
  const [router] = useState(() => createBrowserRouter(routes))

  return <RouterProvider router={router} />
}

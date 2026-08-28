import { RouterProvider } from 'react-router-dom'
import '../App.css'
import { router } from './routes'
import SessionExpiryModal from '@/components/ui/SessionExpiryModal'

function App() {
  // Capture session_id and other user parameters from URL query params
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  if (sessionId) {
    // Clear old session and shop state for a clean login
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("user_id");
    
    localStorage.setItem("session_id", sessionId);
    const userId = params.get("user_id");
    if (userId) localStorage.setItem("user_id", userId);
    const email = params.get("email");
    if (email) localStorage.setItem("user_email", email);
    const name = params.get("name");
    if (name) localStorage.setItem("user_name", name);
    
    // Clear query parameters from URL history for cleanliness
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return (
    <>
      <RouterProvider router={router} />
      <SessionExpiryModal />
    </>
  )
}

export default App

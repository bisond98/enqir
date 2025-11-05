import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an old notification URL that needs redirect
    const pathname = location.pathname;
    
    // Handle old /enquiry-responses/:id route
    if (pathname.startsWith('/enquiry-responses/')) {
      const enquiryId = pathname.replace('/enquiry-responses/', '');
      if (enquiryId) {
        // Redirect to correct route
        navigate(`/enquiry/${enquiryId}/responses-page`, { replace: true });
        return;
      }
    }
    
    // Only log if it's not a handled redirect
    if (!pathname.includes('enquiry-responses')) {
      console.warn("404: Route not found:", pathname);
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <button 
          onClick={() => navigate('/')}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;

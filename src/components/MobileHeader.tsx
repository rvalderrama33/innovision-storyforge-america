import React, { useState } from "react";
import { Link } from "react-router-dom";

const MobileHeader = () => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="bg-white px-4 border-b border-gray-100 shadow-sm">
      <div className="flex justify-center">
        <Link to="/" className="block">
          {imageError ? (
            <div className="text-center">
              <h1 className="text-xl font-bold text-blue-600">
                America Innovates
              </h1>
              <p className="text-sm text-gray-600">
                Magazine
              </p>
            </div>
          ) : (
            <img 
              src="/lovable-uploads/2108e82a-9d65-4ee6-b974-51aa5bc01a16.png" 
              alt="America Innovates Magazine" 
              className="h-36 w-auto max-w-[720px] object-contain"
              onError={handleImageError}
            />
          )}
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
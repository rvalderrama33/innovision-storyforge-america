import React, { useState } from "react";
import { Link } from "react-router-dom";

const MobileHeader = () => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="bg-white px-4 py-4 border-b border-gray-100 shadow-sm">
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
              src="/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png" 
              alt="America Innovates Magazine" 
              className="h-12 w-auto max-w-[240px] object-contain"
              onError={handleImageError}
            />
          )}
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
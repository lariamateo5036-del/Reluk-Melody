import React from 'react';

interface AriaLiveAnnouncerProps {
  message: string;
}

const AriaLiveAnnouncer: React.FC<AriaLiveAnnouncerProps> = ({ message }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="visually-hidden"
    >
      {message}
    </div>
  );
};

export default AriaLiveAnnouncer;

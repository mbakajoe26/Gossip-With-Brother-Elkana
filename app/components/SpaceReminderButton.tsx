'use client';
import { useState } from 'react';

interface SpaceReminderButtonProps {
  spaceId: string;
  title: string;
  scheduledfor: string;
}

export default function SpaceReminderButton({ spaceId, title, scheduledfor }: SpaceReminderButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/spaces/reminder/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceId,
          title,
          scheduledfor,
        }),
      });

      if (!response.ok) throw new Error('Failed to subscribe');
      
      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing to reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={isSubscribed || isLoading}
      className={`block w-full text-center ${
        isSubscribed 
          ? 'bg-green-500 hover:bg-green-600' 
          : 'bg-blue-500 hover:bg-blue-600'
      } text-white font-semibold py-2 px-4 rounded-full transition-colors`}
    >
      {isSubscribed 
        ? '✓ Notification Set' 
        : isLoading 
          ? 'Setting notification...' 
          : 'Notify me'}
    </button>
  );
} 
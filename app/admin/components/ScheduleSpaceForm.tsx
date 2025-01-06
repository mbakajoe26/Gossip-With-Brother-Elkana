'use client';

import { useState } from 'react';

interface ScheduleSpaceFormData {
  title: string;
  scheduledFor: string;
  guestSpeaker: string;
  description: string;
}

export default function ScheduleSpaceForm() {
  const [formData, setFormData] = useState<ScheduleSpaceFormData>({
    title: '',
    scheduledFor: '',
    guestSpeaker: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/spaces/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule space');
      }

      setSuccess(true);
      setFormData({
        title: '',
        scheduledFor: '',
        guestSpeaker: '',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          Space scheduled successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input 
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full p-2 border rounded-md dark:bg-gray-700"
          placeholder="Space Title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Date & Time</label>
        <input 
          type="datetime-local"
          value={formData.scheduledFor}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
          className="w-full p-2 border rounded-md dark:bg-gray-700"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Guest Speaker</label>
        <input 
          type="text"
          value={formData.guestSpeaker}
          onChange={(e) => setFormData(prev => ({ ...prev, guestSpeaker: e.target.value }))}
          className="w-full p-2 border rounded-md dark:bg-gray-700"
          placeholder="@twitter_handle"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea 
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-md dark:bg-gray-700"
          rows={4}
          placeholder="Space description..."
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? 'Scheduling...' : 'Schedule Space'}
      </button>
    </form>
  );
} 
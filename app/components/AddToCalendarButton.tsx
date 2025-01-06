'use client';

interface AddToCalendarButtonProps {
  title: string;
  description: string;
  startTime: string;
}

export default function AddToCalendarButton({ title, description, startTime }: AddToCalendarButtonProps) {
  const handleAddToCalendar = () => {
    // Format the date for Google Calendar
    const date = new Date(startTime);
    const endDate = new Date(date.getTime() + (60 * 60 * 1000)); // 1 hour duration

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <button
      onClick={handleAddToCalendar}
      className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors"
    >
      Add to Calendar
    </button>
  );
} 
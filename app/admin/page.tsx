import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ScheduleSpaceForm from "./components/ScheduleSpaceForm";
import { supabase } from "@/utils/supabase";

// Interface for scheduled spaces
interface ScheduledSpace {
  id: string;
  title: string;
  scheduledFor: string;
  guestSpeaker: string;
  description: string;
  createdAt: string;
}

async function getScheduledSpaces(): Promise<ScheduledSpace[]> {
  try {
    // Test query first
    const { data: test, error: testError } = await supabase
      .from('scheduled_spaces')
      .select('count');
    
    console.log('Test query result:', { test, testError });

    // Main query
    const { data: spaces, error } = await supabase
      .from('scheduled_spaces')
      .select('*')
      .order('scheduledfor', { ascending: true }); // Note: lowercase column name

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    return spaces || [];
  } catch (error) {
    console.error('Error fetching scheduled spaces:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  const { userId } = await auth();
  
  // Check if user is admin
  const isAdmin = userId === process.env.ADMIN_USER_ID;
  
  if (!isAdmin) {
    redirect('/');
  }

  const scheduledSpaces = await getScheduledSpaces();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {/* Schedule Space Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schedule Space</h2>
          <ScheduleSpaceForm />
        </section>
        
        {/* Upcoming Spaces Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Spaces</h2>
          <div className="space-y-4">
            {scheduledSpaces.length > 0 ? (
              scheduledSpaces.map((space) => (
                <div 
                  key={space.id}
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <h3 className="text-xl font-semibold mb-2">{space.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {new Date(space.scheduledFor).toLocaleString()}
                  </p>
                  {space.guestSpeaker && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Guest: {space.guestSpeaker}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{space.description}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No scheduled spaces yet</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
} 
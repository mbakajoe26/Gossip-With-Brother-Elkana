import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { getLiveSpacesByUsername } from "../utils/twitter";

interface TwitterSpace {
  id: string;
  title: string;
  hostUsername: string;
  isLive: boolean;
  participantCount: number;
  scheduledStart?: string;
}

export default async function Home() {
  const { userId } = await auth();
  
  // Fetch live spaces from @joetechgeek
  let liveSpaces: TwitterSpace[] = [];
  try {
    liveSpaces = await getLiveSpacesByUsername('joetechgeek');
  } catch (error) {
    console.error("Failed to fetch spaces:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Gossip With Brother Elkana</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Join our meaningful conversations on relationships, family, and wellness
          </p>
        </div>

        {/* Live Spaces Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Live Now</h2>
          {liveSpaces.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveSpaces.map((space) => (
                <div 
                  key={space.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-red-500 flex items-center gap-2">
                      <span className="animate-pulse h-3 w-3 rounded-full bg-red-500"></span>
                      LIVE
                    </span>
                    <span className="text-sm text-gray-500">
                      {space.participantCount} listening
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{space.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Hosted by {space.hostUsername}
                  </p>
                  <a
                    href={`https://twitter.com/i/spaces/${space.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors"
                  >
                    Join Space
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-300">
              No live spaces at the moment. Check back later!
            </div>
          )}
        </section>

        {/* Authentication Section */}
        {!userId && (
          <section className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Sign in to participate in discussions and earn rewards
            </p>
            <SignInButton mode="modal">
              <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
                Sign In with Twitter
              </button>
            </SignInButton>
          </section>
        )}
      </main>
    </div>
  );
}

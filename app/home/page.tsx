
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Gift,
  MapPin,
  Users,
  UserRound,
  Leaf,
} from "lucide-react";

// Temporary data until your teammates finish
// authentication and activity integration.
const activities = [
  {
    title: "Campus Photography Walk",
    category: "Photography · Outdoors",
    location: "De Anza College",
    description:
      "Explore campus and meet students who enjoy photography.",
  },
  {
    title: "Study Together",
    category: "Academics · Social",
    location: "De Anza College",
    description:
      "Find students interested in a group study session.",
  },
];

const exploreLinks = [
  {
    title: "Activities",
    description: "Discover things to do around campus.",
    href: "/activities",
    icon: CalendarDays,
  },
  {
    title: "Connections",
    description: "Meet students with similar interests.",
    href: "/connections",
    icon: Users,
  },
  {
    title: "Resources",
    description: "Find useful campus benefits.",
    href: "/resources",
    icon: Gift,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900">
      {/* Navigation */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/home"
            className="flex items-center gap-2 text-xl font-bold text-green-800"
          >
            <Leaf size={24} />
            De Anza Link
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/home" className="font-semibold text-green-700">
              Home
            </Link>
            <Link
              href="/activities"
              className="text-gray-600 hover:text-green-700"
            >
              Activities
            </Link>
            <Link
              href="/resources"
              className="text-gray-600 hover:text-green-700"
            >
              Resources
            </Link>
            <Link
              href="/connections"
              className="text-gray-600 hover:text-green-700"
            >
              Connections
            </Link>
          </nav>

          <Link
            href="/profile"
            aria-label="My profile"
            className="rounded-full bg-green-50 p-3 text-green-800 hover:bg-green-100"
          >
            <UserRound size={20} />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl space-y-10 px-5 py-8">
        {/* Welcome section */}
        <section className="rounded-3xl bg-green-800 px-7 py-10 text-white md:px-12">
          <p className="mb-3 text-sm font-medium text-green-100">
            YOUR CAMPUS. YOUR COMMUNITY.
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            Find your people at De Anza.
          </h1>

          <p className="mt-4 max-w-2xl text-green-50">
            Discover new activities, meet students who share
            your interests, and explore opportunities around campus.
          </p>

          <Link
            href="/activities"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-green-800 transition hover:bg-green-50"
          >
            Explore activities
            <ArrowRight size={18} />
          </Link>
        </section>

        {/* Explore section */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              What would you like to explore?
            </h2>
            <p className="mt-1 text-gray-500">
              Get more out of your college experience.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {exploreLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-green-300 hover:shadow-md"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-green-50 p-3 text-green-700">
                    <Icon size={26} />
                  </div>

                  <h3 className="text-lg font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {item.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-green-700">
                    Explore
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Activity recommendations */}
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                Activities you might like
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Find something fun to do with other students.
              </p>
            </div>

            <Link
              href="/activities"
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activities.map((activity) => (
              <article
                key={activity.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <span className="text-xs font-semibold text-green-700">
                  SUGGESTED IDEA
                </span>

                <h3 className="mt-2 text-lg font-semibold">
                  {activity.title}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {activity.category}
                </p>

                <p className="mt-3 text-sm text-gray-600">
                  {activity.description}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={16} />
                  {activity.location}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Campus discovery section */}
        <section className="rounded-2xl border border-green-100 bg-green-50 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white p-3 text-green-700">
              <Compass size={26} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Discover hidden campus resources
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                De Anza offers helpful services and opportunities
                that students may not know about. Explore what's
                available and find resources that fit your needs.
              </p>

              <Link
                href="/resources"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-green-700 hover:underline"
              >
                Explore resources
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 border-t border-gray-200 bg-white py-3 md:hidden">
        <Link
          href="/home"
          className="flex flex-col items-center gap-1 text-green-700"
        >
          <Compass size={20} />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          href="/activities"
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <CalendarDays size={20} />
          <span className="text-xs">Activities</span>
        </Link>

        <Link
          href="/connections"
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <Users size={20} />
          <span className="text-xs">People</span>
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <UserRound size={20} />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>

      <div className="h-16 md:hidden" />
    </div>
  );
}
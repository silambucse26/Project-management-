import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  projects,
  users,
  departments,
  initialTasks,
} from "@/data/mockData";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.trim() : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();

  const normalizedQuery = q.toLowerCase();

  const projectResults = projects.filter((project) =>
    project.name.toLowerCase().includes(normalizedQuery),
  );

  const taskResults = initialTasks.filter((task) =>
    task.title.toLowerCase().includes(normalizedQuery),
  );

  const departmentResults = departments.filter((department) =>
    department.name.toLowerCase().includes(q.toLowerCase()),
  );

  const userResults = users.filter((user) =>
    user.name.toLowerCase().includes(q.toLowerCase()),
  );

  const totalResults =
    projectResults.length +
    taskResults.length +
    taskResults.length +
    userResults.length;

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Search Results</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Searching for: <span className="font-medium">{q}</span>
          </p>
        </div>

        {!q && <EmptySearch />}

        {q && totalResults === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
            <Search className="mb-3 size-8 text-muted-foreground" />

            <h2 className="font-semibold">No results found</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Nothing matched “{q}”.
            </p>
          </div>
        )}

        {q && totalResults > 0 && (
          <div className="space-y-8">
            <p className="text-sm text-muted-foreground">
              {totalResults} result{totalResults === 1 ? "" : "s"} found
            </p>

            {projectResults.length > 0 && (
              <ResultSection title="Projects">
                {projectResults.map((project) => (
                  <Link
                    key={project.id}
                    to="/projects/$id"
                    params={{ id: String(project.id) }}
                    className="block rounded-xl border bg-card p-4 transition hover:bg-muted/50"
                  >
                    <h3 className="font-semibold">{project.name}</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Project
                    </p>
                  </Link>
                ))}
              </ResultSection>
            )}

            {taskResults.length > 0 && (
              <ResultSection title="Tasks">
                {taskResults.map((task) => (
                  <Link
                    key={task.id}
                    to="/tasks"
                    className="block rounded-xl border bg-card p-4 transition hover:bg-muted/50"
                  >
                    <h3 className="font-semibold">{task.title}</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Task
                    </p>
                  </Link>
                ))}
              </ResultSection>
            )}

            {taskResults.length > 0 && (
              <ResultSection title="Teams">
                {taskResults.map((team) => (
                  <Link
                    key={team.id}
                    to="/teams"
                    className="block rounded-xl border bg-card p-4 transition hover:bg-muted/50"
                  >
                    <h3 className="font-semibold"></h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Team
                    </p>
                  </Link>
                ))}
              </ResultSection>
            )}

            {userResults.length > 0 && (
              <ResultSection title="Users">
                {userResults.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl border bg-card p-4"
                  >
                    <h3 className="font-semibold">{user.name}</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.title ?? "User"}
                    </p>
                  </div>
                ))}
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function EmptySearch() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
      <Search className="mb-3 size-8 text-muted-foreground" />

      <h2 className="font-semibold">Enter a search term</h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Search projects, tasks, teams, and users.
      </p>
    </div>
  );
}
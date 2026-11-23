import { Link, Outlet } from "react-router";
import { ROUTES } from "../game";
import { HALL_OF_FAME_PATH } from "../hallOfFame";

export function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
      <header className="flex items-center justify-between border-b-2 border-panel-edge py-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          <Link to={ROUTES.start}>
            🎒 Backpack <span className="text-gold">Brawl</span>
          </Link>
        </h1>
        <nav aria-label="Main">
          <Link to={HALL_OF_FAME_PATH} className="font-bold text-gold underline">
            🏆 Hall of fame
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-panel-edge py-3 text-xs tracking-wider text-muted">
        Backpack Brawl · practical exam starter
      </footer>
    </div>
  );
}

import { DeployForm } from "@/components/deployment/deploy-form";
import { Icon } from "@/components/ui/icon";

export default function Page() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <main className="ml-64 flex min-h-screen flex-1 items-start justify-center px-8 pb-12 pt-6">
        <div className="w-full max-w-2xl">
          <header className="mb-10">
            <div className="mb-2 flex items-center gap-3 text-on-surface-variant">
              <Icon name="sparkles" className="size-4" />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">
                Deployment Pipeline
              </span>
            </div>
            <h2 className="mb-2 text-4xl leading-none font-extrabold tracking-tight text-white">
              Deploy to Dokploy
            </h2>
          </header>

          <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-high p-8 shadow-2xl">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-[60px]" />
            <DeployForm />
          </div>
        </div>
      </main>
    </div>
  );
}

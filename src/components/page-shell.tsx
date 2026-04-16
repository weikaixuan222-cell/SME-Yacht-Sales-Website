type PageShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium tracking-wide text-sky-800">
          MVP 第一阶段
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
        </div>
      </section>
      {children}
    </main>
  );
}

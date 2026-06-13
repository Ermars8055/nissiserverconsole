export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">Manage your {title.toLowerCase()} settings and resources.</p>
      </div>
      <div className="h-96 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground">
        {title} content goes here
      </div>
    </div>
  );
}

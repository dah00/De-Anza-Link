export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <p className="mb-8 text-sm font-semibold">DeAnza Link</p>
      {children}
    </main>
  );
}

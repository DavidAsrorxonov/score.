import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xl font-semibold text-foreground">scōre.</p>
          <h1 className="text-2xl font-semibold text-foreground">
            Create account
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Start with a secure scōre. account.
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp />
        </div>
      </section>
    </main>
  );
}

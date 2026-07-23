import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

// Clean locale root: global providers ONLY (i18n messages + locale context).
// No sidebars, no headers, no chrome — the UI shell for each audience lives in
// its own route group: (user)/layout.tsx and (admin)/layout.tsx.
// <html>/<body>, ClerkProvider, Toaster, and analytics live in the true root
// at src/app/layout.tsx.

const locales = ["en", "am"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

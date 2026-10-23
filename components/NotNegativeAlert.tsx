import { NOT_NEGATIVE_WARNING } from "@/lib/rules/sentinel";

export function NotNegativeAlert({ className = "" }: { className?: string }) {
  return (
    <p
      role="alert"
      className={`rounded-md border-2 border-rose-400 bg-rose-50 px-4 py-3 text-base font-bold text-rose-900 ${className}`}
    >
      {NOT_NEGATIVE_WARNING}
    </p>
  );
}

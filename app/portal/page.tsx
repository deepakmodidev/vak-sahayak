import Link from 'next/link';
import { ArrowRight, Mic, PhoneCall } from 'lucide-react';
import { SubmissionsHistory } from '@/components/app/submissions-history';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/shadcn/utils';

interface ChooserCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  Icon: React.ElementType;
}

function ChooserCard({ href, eyebrow, title, description, Icon }: ChooserCardProps) {
  return (
    <Link href={href} className="group block focus:outline-none">
      <Card
        className={cn(
          'border-border hover:border-primary relative h-full justify-between gap-8 rounded-[2rem] p-8 transition-all duration-300',
          'group-hover:scale-[1.01] group-hover:shadow-md group-focus-visible:ring-primary/50 group-focus-visible:ring-[3px]'
        )}
      >
        <div className="space-y-6">
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon size={26} strokeWidth={2} />
          </div>
          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
              {eyebrow}
            </span>
            <h2 className="text-foreground font-serif text-3xl font-normal tracking-[-0.02em]">
              {title}
            </h2>
            <p className="text-muted-foreground max-w-sm text-base leading-relaxed font-light">
              {description}
            </p>
          </div>
        </div>

        <div className="text-foreground group-hover:text-primary flex items-center gap-2 text-sm font-medium tracking-wide transition-colors">
          <span>Continue</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}

export default function PortalChooserPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col px-6 py-16 font-sans">
      <div className="mx-auto w-full max-w-6xl">
        {/* Hero */}
        <header className="flex flex-col items-start gap-8">
          <img src="/vak-sahayak.png" alt="Vak Sahayak Logo" className="h-auto w-20" />
          <div className="space-y-4">
            <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
              Vak Sahayak
            </span>
            <h1 className="text-foreground font-serif text-5xl leading-[0.95] font-normal tracking-[-0.03em] md:text-6xl">
              How would you like to <span className="text-primary/60">fill your form?</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-xl leading-relaxed font-light">
              Choose how you&apos;d like the assistant to help you complete your application.
            </p>
          </div>
        </header>

        {/* Two choices */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          <ChooserCard
            href="/portal/voice"
            eyebrow="In your browser"
            title="Fill by Voice"
            description="Talk in your browser — the assistant fills the form live on screen."
            Icon={Mic}
          />
          <ChooserCard
            href="/portal/call"
            eyebrow="On your phone"
            title="Fill by Phone Call"
            description="Enter your number and we'll call you — no screen needed."
            Icon={PhoneCall}
          />
        </div>

        {/* History hub */}
        <div className="border-border mt-20 border-t pt-16">
          <SubmissionsHistory />
        </div>
      </div>
    </div>
  );
}

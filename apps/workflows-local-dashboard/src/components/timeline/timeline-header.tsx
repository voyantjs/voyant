import { formatTickMs, type Scale } from "./timeline-scale"

export function TimelineHeader({ scale }: { scale: Scale }): React.ReactElement {
  return (
    <div className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
      <div className="relative h-7">
        {scale.ticks.map((t, i) => {
          const pct = (i / (scale.ticks.length - 1)) * 100
          return (
            <div
              key={`${t.labelMs}-${pct}`}
              className="absolute top-0 flex h-full flex-col"
              style={{
                left: `${pct}%`,
                transform:
                  i === 0
                    ? undefined
                    : i === scale.ticks.length - 1
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
              }}
            >
              <span className="text-muted-foreground px-1 font-mono text-[10px] tabular-nums">
                {formatTickMs(t.labelMs)}
              </span>
              <span className="bg-border absolute top-6 h-1 w-px" aria-hidden />
            </div>
          )
        })}
      </div>
    </div>
  )
}

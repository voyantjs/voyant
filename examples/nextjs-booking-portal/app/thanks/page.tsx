interface PageProps {
  searchParams: Promise<{ inquiry?: string }>
}

export default async function ThanksPage({ searchParams }: PageProps) {
  const { inquiry } = await searchParams

  return (
    <div className="thanks">
      <div className="icon" aria-hidden>
        ✓
      </div>
      <h1>Thanks — inquiry received</h1>
      <p>
        A specialist will be in touch within one business day. You can reference this inquiry as{" "}
        <strong>{inquiry ?? "pending"}</strong> in any follow-up email.
      </p>
      <a href="/" className="btn btn-outline" style={{ marginTop: "1rem" }}>
        Browse other tours
      </a>
    </div>
  )
}

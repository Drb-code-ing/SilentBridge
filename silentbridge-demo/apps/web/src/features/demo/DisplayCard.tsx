export function DisplayCard({ message }: { message: string }) {
  return (
    <section className="sb-display-card">
      <div className="sb-display-card__label">把这句话给对方看</div>
      <p>{message}</p>
    </section>
  );
}

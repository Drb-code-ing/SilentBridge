export function Mascot() {
  return (
    <div className="sb-mascot" aria-hidden="true">
      <div className="sb-mascot__antenna" />
      <div className="sb-mascot__face">
        <span className="sb-mascot__eye sb-mascot__eye--left" />
        <span className="sb-mascot__eye sb-mascot__eye--right" />
        <span className="sb-mascot__smile" />
      </div>
      <div className="sb-mascot__shadow" />
    </div>
  );
}

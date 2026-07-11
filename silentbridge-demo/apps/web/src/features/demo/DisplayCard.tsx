export function DisplayCard({
  message,
  fullscreen = false,
  onToggleFullscreen
}: {
  message: string;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  if (fullscreen) {
    return (
      <section className="sb-display-card sb-display-card--fullscreen" role="dialog" aria-label="给对方看的全屏文字">
        <div className="sb-display-card__fullscreen-bar">
          <span>请对方看这里</span>
          <button type="button" className="sb-display-card__exit" onClick={onToggleFullscreen}>
            退出全屏
          </button>
        </div>
        <p>{message}</p>
        <div className="sb-display-card__fullscreen-hint">看完后点「退出全屏」继续收听</div>
      </section>
    );
  }

  return (
    <section className="sb-display-card">
      <div className="sb-display-card__label">把这句话给对方看</div>
      <p>{message}</p>
      {onToggleFullscreen && (
        <button type="button" className="sb-display-card__expand" onClick={onToggleFullscreen}>
          全屏出示
        </button>
      )}
    </section>
  );
}

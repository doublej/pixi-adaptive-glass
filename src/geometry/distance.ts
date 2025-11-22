// Calculate signed distance to rounded rect boundary (positive = inside)
export function getDistanceToBoundary(
  px: number, py: number,
  w: number, h: number,
  radius: number
): number {
  const cx = w / 2;
  const cy = h / 2;
  const relX = Math.abs(px + 0.5 - cx);
  const relY = Math.abs(py + 0.5 - cy);

  const innerW = cx - radius;
  const innerH = cy - radius;

  if (relX <= innerW && relY <= innerH) {
    return Math.min(innerW + radius - relX, innerH + radius - relY);
  } else if (relX > innerW && relY <= innerH) {
    return radius - (relX - innerW);
  } else if (relY > innerH && relX <= innerW) {
    return radius - (relY - innerH);
  } else {
    const dx = relX - innerW;
    const dy = relY - innerH;
    return radius - Math.sqrt(dx * dx + dy * dy);
  }
}

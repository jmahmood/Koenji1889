// Outer window sizes, including the title bar. Small desktops take precedence;
// the window body scrolls while its contents retain a readable layout.
export const MAP_WINDOW_MIN_SIZES = {
  hex: { width: 600, height: 420 },
  corporations: { width: 480, height: 320 },
  trains: { width: 560, height: 360 },
  privates: { width: 600, height: 440 },
  activity: { width: 400, height: 260 },
};

export function mapWindowMinimumSize(id, availableWidth, availableHeight) {
  const minimum = MAP_WINDOW_MIN_SIZES[id];
  return {
    width: Math.min(minimum.width, Math.max(1, availableWidth)),
    height: Math.min(minimum.height, Math.max(1, availableHeight)),
  };
}

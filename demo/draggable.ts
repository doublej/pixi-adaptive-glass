const POSITIONS_KEY = 'adaptive-glass-positions';

function savePositions() {
  const positions: Record<string, { left: string; top: string }> = {};
  document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
    const id = el.id || el.dataset.panelId;
    if (id && el.style.left && el.style.top) {
      positions[id] = { left: el.style.left, top: el.style.top };
    }
  });
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
}

export function setupDraggables() {
  let draggedElement: HTMLElement | null = null;
  let offset = { x: 0, y: 0 };

  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    const draggable = target.closest('.draggable-item') as HTMLElement;

    if (draggable) {
      draggedElement = draggable;
      const rect = draggable.getBoundingClientRect();
      offset.x = e.clientX - rect.left;
      offset.y = e.clientY - rect.top;
      draggable.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (draggedElement) {
      e.preventDefault();
      const x = e.clientX - offset.x;
      const y = e.clientY - offset.y;

      draggedElement.style.left = `${x}px`;
      draggedElement.style.top = `${y}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (draggedElement) {
      draggedElement.style.cursor = 'grab';
      savePositions();
      draggedElement = null;
    }
  });
}
